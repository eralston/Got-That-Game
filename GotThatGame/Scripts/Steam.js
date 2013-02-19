
// Global variables for page element templates
var playerProfileTemplate = null;
var playerProfileLoadingTemplate = null;
var friendItemTemplate = null;
var gameItemTemplate = null;

// For storing a universal cache of game objects, then outputting their info for comparison purposes
var GameHasher = function () {
    var allGames = {};

    ///
    /// Create a hash in the form (value of AppId property, object) for the given array of gamess
    /// As a side-effect, this keeps a list of games that have passed through the system
    ///
    this.createGameHash = function (arraysOfObjects) {
        if (arraysOfObjects) {
            var ret = {};
            for (i in arraysOfObjects) {
                var obj = arraysOfObjects[i];
                ret[obj["AppId"]] = obj;
                // an accumulation of all games passing through the system
                allGames[obj["AppId"]] = obj;
            }
            return ret;
        }
    };

    this.hashGamesForPlayer = function (player) {
        if (player == undefined)
            return;

        if (player.Games == undefined || player.Games == null)
            return;

        player.GamesHash = this.createGameHash(player.Games);
    };

    ///
    /// For a hash in the form (appId, count), returns an array of games from the local cache of all games
    ///
    this.getGamesWithCounts = function (hashCount, total) {
        var ret = [];
        for (appId in hashCount) {
            var count = hashCount[appId];
            var game = _.clone(allGames[appId]);
            if (game) {
                game.Count = count;
                game.Total = total;
                ret.push(game);
            }
        }
        return ret;
    };
};

window.gameHasher = new GameHasher();

// A class for storing players, locally for speed and in localStorage for persistence
var PlayerCache = function () {
    var players = {};
    var friendlyNameToSteamId = {};

    this.cachePlayer = function (player) {

        players[player.SteamId] = player;

        if (player.FriendlyName != undefined)
            friendlyNameToSteamId[player.FriendlyName] = player.SteamId;

        if (localStorage) {
            localStorage.setItem("steamIdForFriendlyName" + player.FriendlyName, player.SteamId);
            localStorage.setItem("player" + player.SteamId, JSON.stringify(player));
        }
    };

    this.getPlayerBySteamId = function (steamId) {
        if (steamId in players)
            return players[steamId];

        if (localStorage) {
            var playerJson = localStorage.getItem("player" + steamId);
            if (playerJson) {
                var player = JSON.parse(playerJson);

                // additional processing to build games cache
                window.gameHasher.hashGamesForPlayer(player);

                return player;
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    };

    this.getPlayerByFriendlyName = function (friendlyName) {

        if (friendlyName in friendlyNameToSteamId)
            return this.getPlayerBySteamId(friendlyNameToSteamId[friendlyName]);

        if (localStorage) {
            var steamId = localStorage.getItem("steamIdForFriendlyName" + friendlyName);
            if (steamId) {
                return this.getPlayerBySteamId(steamId);
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    };
};

window.playerCache = new PlayerCache();

// Model for players, including friends and games
var Player = Backbone.Model.extend({

    initialize: function () {
        _.bindAll(this, "getPlayer", "setPlayer", "cachePlayer", "loadByFriendlyName", "loadBySteamId", "loadDone", "loadGames", "loadFriends");
    },

    cachePlayer: function (player) {
        window.playerCache.cachePlayer(player);
    },

    getPlayer: function () {
        var steamId = this.get("steamId");
        return window.playerCache.getPlayerBySteamId(steamId);
    },

    setPlayer: function (player) {
        player.DateLoaded = new Date();
        this.id = player.SteamId;
        this.cachePlayer(player);
        this.set({ steamId: player.SteamId });
    },

    // Loading Header
    loadByPlayerHeader: function (playerHeader) {
        this.setPlayer(playerHeader);
        this.trigger("header-loaded");
    },

    loadByFriendlyName: function (friendlyName, force) {

        // check if we can pull from cache
        if (!force) {
            var player = window.playerCache.getPlayerByFriendlyName(friendlyName);
            if (player) {
                this.setPlayer(player);
                this.trigger("header-loaded");
                return;
            }
        }

        // if we can't, then fall back to web services
        this.trigger("header-loading");
        $.get("/Steam/PlayerByFriendlyName/" + friendlyName, this.loadDone);
    },
    loadBySteamId: function (steamId, force) {

        // check if we can pull from cache
        if (!force) {
            var player = window.playerCache.getPlayerBySteamId(steamId);
            if (player) {
                this.setPlayer(player);
                this.trigger("header-loaded");
                return;
            }
        }

        // if we can't, then fall back to web services
        this.trigger("header-loading");
        $.get("/Steam/PlayerBySteamId/" + steamId, loadDone);
    },

    loadDone: function (player, textStatus, jqXHR) {

        // load this object
        this.setPlayer(player);

        // trigger listeners
        this.trigger("header-loaded");
    },

    // Loading games

    loadGames: function (force) {
        var thisModel = this;
        var player = thisModel.getPlayer();

        if (force == undefined || !force) {
            if (player.Games != undefined && player.Games != null) {
                thisModel.trigger("games-loaded");
                return;
            }
        }

        thisModel.trigger("games-loading");

        $.get("/Steam/GamesBySteamId/" + player.SteamId, function (games, textStatus, jqXHR) {

            var player = thisModel.getPlayer();

            player.Games = games;
            player.GamesHash = window.gameHasher.createGameHash(games);

            thisModel.setPlayer(player);

            thisModel.trigger("games-loaded");
        }).fail(function () {
            thisModel.trigger("games-load-failed");
        });
    },

    // Loading friends (should only be done for logged in user)

    loadFriends: function (force) {
        var thisModel = this;
        var player = thisModel.getPlayer();

        // if we aren't forced and we already have friends, just offer those up
        if (force != undefined || !force) {
            if (player.Friends != undefined || player.Friends != null) {
                thisModel.trigger("friends-loaded");
                return;
            }
        }

        this.trigger("friends-loading");
        $.get("/Steam/FriendsBySteamId/" + player.SteamId, function (friends, textStatus, jqXHR) {
            var player = thisModel.getPlayer();

            for (i in friends) {
                var friend = friends[i];
                window.playerCache.cachePlayer(friend);
            }

            player.Friends = friends;
            thisModel.setPlayer(player);

            thisModel.trigger("friends-loaded");
        }).fail(function () {
            thisModel.trigger("friends-load-failed");
        });
    }
});

// Collection for holding friends of the current player
var FriendCollection = Backbone.Collection.extend({

    model: Player,

    addFriends: function (friends) {
        for (i in friends) {
            var friend = friends[i];
            // wrap it up in a model and add it to the collection
            var model = new Player();
            model.loadByPlayerHeader(friend);
            this.add(model);
        }
    }
});

// model for comparing game collections between sets of players
var ComparisonModel = Backbone.Model.extend({

    initialize: function () {
        _.bindAll(this, "addPlayer", "compare", "playerLoaded");
        this.set({ players: {} });
    },

    // adds a player to the comparison
    addPlayer: function (playerModel) {

        playerModel.on("games-loaded", playerLoaded);

        // update the list of players
        var players = this.get("players");
        players[steamId] = player;
        this.set({ players: players });
    },

    // starts the comparison, async completing on the "comparison-complete" event
    compare: function () {
        this.trigger("comparison-started");
        var players = this.get("players");
        for (i in players)
            players[i].loadGames();
    },

    areAllPlayersLoaded: function () {
        var players = this.get("players");
        for (i in players) {
            var player = players[i];
            if (player.Games == undefined || player.Games == null)
                return false;
        }
        return true;
    },

    ///
    /// Increments the value at the given key within the given hash
    ///
    incrementHashAtKey: function (key) {
        if (!(key in comparisonHash))
            comparisonHash[key] = 1;
        else
            comparisonHash[key] = 1 + comparisonHash[key];
    },

    ///
    /// Accumulates the count of shared games between the two player objects, modifying the given count hash
    ///
    accumulateCount: function (player) {
        for (appId in player.GamesHash) {
            incrementHashAtKey(appId);
        }
    },

    ///
    /// Called when a player's games are loaded and we conditionally perform the comparison if they are complete
    ///
    playerLoaded: function () {

        // check if we're still waiting
        if (!this.areAllPlayersLoaded) {
            this.trigger("comparison-continues");
            return;
        }

        var comparisonHash = {};

        // perform the collection comparison

        // count the player
        this.accumulateCount(currentPlayer);

        // accumulate the friends
        for (i in friendSteamIds) {
            var friend = steam.getFromPlayerCache(friendSteamIds[i]);
            this.accumulateCount(friend);
        }

        // set the result of the accumulation
        this.games = steam.getGamesWithCounts(comparisonHash, friendSteamIds.length + 1);
        this.trigger("comparison-complete");
    }
});

///
/// A view for the right-side of the screen when performing a comparison
///
var ComparisonView = Backbone.View.extend({

    className: ".game-comparison",

    events: {
        "click .refresh": "refresh"
    },

    initialize: function () {
        _.bindAll(this, "render", "renderFail");
        this.listenTo(this.model, "comparison-started", this.render);
        this.listenTo(this.model, "comparison-continues", this.render);
        this.listenTo(this.model, "comparison-complete", this.renderFail);

        this.render();
    },

    template: _.template($("#_gameItemTemplate").html()),
    loadingTemplate: _.template($("#_gamesLoadingTemplate").html()),
    failTemplate: _.template($("#_gamesLoadFailedTemplate").html()),

    refresh: function () {
        this.model.compare();
    },

    render: function () {
        var comparison = this.model;
    },
    renderFail: function () {
        this.$el.html(this.failTemplate());
    }
});

// View for one row in the friends list
var FriendView = Backbone.View.extend({
    events: {
        "click .refresh": "refresh",
        "click": "toggle"
    },

    initialize: function () {
        this.render();
    },

    refresh: function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.model.loadGames();
    },

    template: _.template($("#_friendItemTemplate").html()),

    render: function () {
        this.$el.html(this.template(this.model.getPlayer()));
    },

    // event handlers

    toggle: function () {
        var $this = this.$el;
        if ($this.hasClass("selected")) {
            $this.removeClass("selected");
        } else {
            $this.addClass("selected");

        }
    }
});

// Displays friend information for the current player
var FriendsView = Backbone.View.extend({
    className: "friend-view",

    events: {
    },

    initialize: function () {
        _.bindAll(this, "render", "renderFail");

        this.listenTo(this.model, "friends-loading", this.render);
        this.listenTo(this.model, "friends-loaded", this.render);
        this.listenTo(this.model, "friends-load-failed", this.renderFail);
    },

    loadingTemplate: _.template($("#_friendsLoadingTemplate").html()),
    failTemplate: _.template($("#_friendsLoadFailedTemplate").html()),

    render: function () {
        var player = this.model.getPlayer();
        var $root = this.$el;

        // show loader if we don't have friends
        if (player.Friends == undefined || player.Friends == null) {
            this.$el.html(this.loadingTemplate());
        } else {
            var friends = player.Friends;
            var friendsCollection = new FriendCollection();

            friendsCollection.on("add", function (model) {
                // add a friend view
                var friendView = new FriendView({ model: model });
                $root.append(friendView.el);
                model.view = friendView;
            });

            friendsCollection.on("remove", function (a, b, c) {
                // remove a friend view
                model.View.remove();
            });

            friendsCollection.addFriends(friends);
        }
    },
    renderFail: function () {
        this.$el.html(this.failTemplate());
    }
});

var GamesView = Backbone.View.extend({
    events: {
        "click .refresh-games": "refresh"
    },

    initialize: function () {
        _.bindAll(this, "render", "renderFail");
        this.listenTo(this.model, "games-loading", this.render);
        this.listenTo(this.model, "games-loaded", this.render);
        this.listenTo(this.model, "games-load-failed", this.renderFail);

        this.render();
    },

    template: _.template($("#_gameItemTemplate").html()),
    loadingTemplate: _.template($("#_gamesLoadingTemplate").html()),
    failTemplate: _.template($("#_gamesLoadFailedTemplate").html()),

    refresh: function () {
        this.model.loadGames();
    },

    render: function () {
        var player = this.model.getPlayer();

        if (player.Games == undefined || player.Games == null) {
            this.$el.html(this.loadingTemplate());
        } else {
            var gamesHtml = "";

            for (i in player.Games) {
                var game = player.Games[i];
                if (game.Count == undefined)
                    game.Count = 0;
                if (game.Total == undefined)
                    game.Total = 0;
                gamesHtml += this.template(game);
            }

            this.$el.html(gamesHtml);
            this.$el.addClass("current-player-games");
        }
    },
    renderFail: function () {
        this.$el.html(this.failTemplate());
    }
});

// Displays information for the current player at the top of the page
var CurrentPlayerView = Backbone.View.extend({

    events: {
    },

    initialize: function () {
        _.bindAll(this, "render");
        this.listenTo(this.model, "header-loaded", this.render);
    },

    template: _.template($("#_currentPlayerProfileTemplate").html()),

    loadCurrentPlayerGameColletion: function () {

        window.gameView = new GamesView({ model: this.model });
        $("#_gameList").append(window.gameView.$el);

        this.model.loadGames();
    },

    loadCurrentPlayerFriends: function () {
        if (window.friendsView != undefined && window.friendsView != null)
            window.friendsView.remove();

        window.friendsView = new FriendsView({ model: this.model });
        $("#_friendList").append(window.friendsView.$el);
        this.model.loadFriends();
    },

    loadCurrentPlayerComparison: function (selectedElements) {

        var comparisonModel = new ComparisonModel();

        selectedElements.each(function () {
            var steamId = $(this).attr("data-id");

        });

        window.gameView = new GamesView({ model: this.model });
        $("#_gameList").append(window.gameView.$el);
    },

    loadGameView: function () {

        if (window.gameView != undefined && window.gameView != null)
            window.gameView.remove();

        var selectedElements = $(".friend-list .selected");

        // if we have no friends, then just show our collection
        if (selectedElements.length == 0)
            this.loadCurrentPlayerGameColletion(selectedElements);
        else
            this.loadCurrentPlayerGameColletion();
    },

    render: function () {
        var playerModel = this.model.getPlayer();
        if (playerModel != undefined) {
            var html = this.template(playerModel);
            this.$el.html(html);

            $(".main-app-window").fadeIn(500);

            this.loadCurrentPlayerFriends();

            this.loadGameView();
        }
    }
});

var ComparisonView = Backbone.View.extend({
    events: {
    },

    initialize: function () {
        _.bindAll(this, "render");
        this.listenTo(this.model, "header-loaded", this.render);
    },

    template: _.template($("#_currentPlayerProfileTemplate").html()),

    render: function () {
        var playerModel = this.model.getPlayer();
        if (playerModel != undefined) {

        }
    }
});

//// instance the steam object

//window.currentPlayerSteamId = null;
//window.currentPlayer = null;
//window.friendSteamIds = null;

/////
///// Helper function clear the current player info container and appends the given element as a child
/////
//function applyElementToPlayerInfo(element) {

//    $("#currentPlayerInfo")
//            .children().remove()
//            .end()
//            .append(element).hide().fadeIn(500);
//}

/////
///// Displays the given game list for the user
/////
//function loadGames(games, displayAll) {
//    // setup games
//    var gameHtml = "";
//    for (i in games) {
//        var game = games[i];
//        if (game.Count == undefined)
//            game.Count = 0;
//        if (game.Total == undefined)
//            game.Total = 0;
//        gameHtml += gameItemTemplate(game);
//    }

//    var root = $("#_gameList");
//    root
//        .children().remove()
//        .end()
//        .append($(gameHtml));
//    if (displayAll)
//        root.addClass("current-player-games");
//    else
//        root.removeClass("current-player-games");

//    if (gameHtml != "") {
//        $("#_gameList").children().tsort({ order: 'desc', attr: 'data-count' });
//    }
//}

/////
///// Loads the current player's game collection
/////
//function loadCurrentPlayerGames() {

//}

/////
///// Called after a successful retrieval of the current player, populating their friend and game list
/////
//function loadCurrentPlayerSuccess(player) {

//    // save the current player SteamId for later
//    currentPlayer = player;

//    applyElementToPlayerInfo($(playerProfileTemplate(player)));

//    // setup friends
//    var friendHtml = "";
//    for (i in player.Friends)
//        friendHtml += friendItemTemplate(player.Friends[i]);

//    $("#_friendList")
//        .children().remove()
//        .end()
//        .append($(friendHtml));

//    loadGames(player.Games, true);

//    $(".main-app-window").fadeIn(500);
//}

/////
///// Utility function for strings that remove leading and trailing whitespace
/////
//String.prototype.trim = function () {
//    return this.replace(/^\s+|\s+$/g, "");
//}

/////
///// Returns true if the complete list of friends is fully loaded; otherwise, returns false
/////
//function areFriendsFullyLoaded() {
//    for (i in friendSteamIds) {
//        if (!steam.isPlayerInCacheWithGameData(friendSteamIds[i]))
//            return false;
//    }
//    return true;
//}

/////
///// Calculates the right-side game list from the current selection, performing async update when needed
/////
//function calculateGameList() {

//    friendSteamIds = [];

//    var selectedElements = $(".friend-list .selected");

//    // if we have no friends, then just show our collection
//    if (selectedElements.length == 0) {
//        loadCurrentPlayerGames();
//        return;
//    }

//    selectedElements.each(function () {
//        var playerListItem = $(this);
//        playerListItem.attr("data-loading", "true");
//        playerListItem.addClass("loading");
//        var steamId = playerListItem.attr("data-id");
//        friendSteamIds.push(steamId);
//        steam.getPlayerGamesBySteamId(steamId,
//            function () {

//                // hide the loader image since we're done loading
//                playerListItem.removeClass("loading");

//                // if all friends are not loaded, then we must try again later
//                if (!areFriendsFullyLoaded())
//                    return;

//                // perform the comparison and display the results
//                var comparison = new GameCollectionComparison(currentPlayer);
//                loadGames(comparison.games);
//            });
//    });
//}

///
/// Clears the UI of its current state, then asynchronously loads up a new user given the state of the username input
///
function loadCurrentPlayer() {
    var username = $("#username").val();
    username = username.trim();
    if (username == "")
        return;

    window.currentPlayerModel = new Player();

    if (window.currentPlayerView != undefined && window.currentPlayerView != null)
        window.currentPlayerView.remove();

    window.currentPlayerView = new CurrentPlayerView({ model: window.currentPlayerModel });
    $("#currentPlayerInfo").append(window.currentPlayerView.$el)
    window.currentPlayerModel.loadByFriendlyName(username);
}

///
/// Called when the application first loads, performing first-time setup
///
function load() {

    // events

    var debouncedLoadCurrentPlayer = _.debounce(loadCurrentPlayer, 500);

    $("#username").keyup(debouncedLoadCurrentPlayer);

    // kick off in the event of carried over value (like in firefox reload)
    loadCurrentPlayer();
}

// fire the load function on document ready
$(load);