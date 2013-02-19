﻿
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
            localStorage.setItem("steamIdForFriendlyName" + player.SteamId, player.FriendlyName);
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

///
/// Constructor for a Steam object that proxies to the SteamController class
///
function Steam(errorCallback) {

    var playerCache = {};


    // PLAYER CACHE

    ///
    /// Sets the cache to store the given player under the given key
    ///
    var setPlayerCache = function (key, player) {
        playerCache[key] = player;
        // try from localstorage
        if (localStorage)
            localStorage.setItem("player" + key, JSON.stringify(player));
    };

    ///
    /// Tries to retrieve the given player from the cache
    ///
    this.getFromPlayerCache = function (key) {
        var val = playerCache[key];
        if (val != undefined)
            return val;

        // try from localstorage
        if (localStorage != undefined) {
            // pull it from localStorage and also push it through to the player cache object
            var cachedVal = localStorage["player" + key];
            if (cachedVal) {
                try {
                    return playerCache[key] = JSON.parse(cachedVal);
                }
                catch (err) {
                    localStorage[key] = undefined;
                }
            }
        }

        return undefined;
    };

    var getFromPlayerCache = this.getFromPlayerCache;

    ///
    /// Returns true if the given player is in the cache; otherwise returns false
    ///
    this.isPlayerInCache = function (key) {
        var val = playerCache[key];
        if (val != undefined)
            return true;

        // try from localstorage
        if (localStorage != undefined) {
            return localStorage["player" + key] != undefined;
        }

        return false;
    };

    var isPlayerInCache = this.isPlayerInCache;

    ///
    /// Returns true if the given player is in the cache with values fully loaded; otherwise, returns false
    ///
    this.isPlayerInCacheWithGameData = function (key) {
        var player = getFromPlayerCache(key);
        if (player == undefined)
            return false;
        return player.Games != undefined;
    }

    // load player cache on creation if we have localStorage
    if (localStorage) {
        for (var i = 0; i < localStorage.length; ++i) {
            var key = localStorage.key(i);
            if (key.indexOf("player") == 0) {
                try {
                    var item = JSON.parse(localStorage[key]);
                    if (item) {
                        item.GamesHash = createGameHash(item.Games);
                    }
                }
                catch (err) {
                    localStorage[key] = undefined;
                }
            }
        }
    }

    // CURRENT PLAYER (Player + Friends)

    ///
    /// Loads a current player object over AJAX, calling via friendly name (AKA vanity URL)
    ///
    this.getCurrentPlayerByFriendlyName = function (friendlyName, callback) {

        // check the cache and return from there if we have it
        var player = getFromPlayerCache(friendlyName);
        if (player != undefined) {
            callback(player);
            return;
        }

        /// try from AJAX
        $.get("/Steam/CurrentUserPlayerByFriendlyName/" + friendlyName,
            function (player, textStatus, jqXHR) {

                // form cache of games
                player.GamesHash = createGameHash(player.Games);

                // cache by both friendlyName and 
                setPlayerCache(friendlyName, player);
                setPlayerCache(player.SteamId, player);

                // if he brought friends, then also load them into the cache
                if (player.Friends != undefined) {
                    for (i in player.Friends) {
                        var friend = player.Friends[i];
                        setPlayerCache(friend.SteamId, friend);
                    }
                }

                callback(player);
            });
    };

    ///
    /// Loads a current player object over AJAX, calling via steam ID
    ///
    this.getCurrentPlayerBySteamId = function (steamId, callback) {

        // check the cache and return from there if we have it
        var val = getFromPlayerCache(steamId);
        if (val != undefined) {
            callback(val);
            return;
        }

        $.get("/Steam/CurrentUserPlayerByFriendlyName/" + steamId,
            function (player, textStatus, jqXHR) {
                setPlayerCache(steamId, player);
                callback(player);
            });
    };

    // GAMES

    ///
    /// Loads a player's game collection via AJAX
    ///
    this.getPlayerGamesBySteamId = function (steamId, callback) {

        // check the cache and return from there if we have it
        var val = getFromPlayerCache(steamId);
        if (val != undefined) {
            if (val.Games != undefined) {
                callback(val);
                return;
            }
        }

        // AJAX the game list
        $.get("/Steam/GamesBySteamId/" + steamId,
            function (games, textStatus, jqXHR) {
                var player = getFromPlayerCache(steamId);
                player.Games = games;
                player.GamesHash = createGameHash(games);
                setPlayerCache(player.SteamId, player);
                callback(player);
            });

    };
};

// Model for players, including friends and games
var Player = Backbone.Model.extend({

    initialize: function () {
        _.bindAll(this, "getPlayer", "setPlayer", "cachePlayer", "loadByFriendlyName", "loadBySteamId", "loadDone", "loadGames", "loadFriends");
    },

    cachePlayer: function (player) {
        window.playerCache.cachePlayer(player);
    },

    getPlayer: function () {
        return this.get("player");
    },

    setPlayer: function (player) {
        player.DateLoaded = new Date();
        this.cachePlayer(player);
        this.set({ player: player });
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
        var player = thisModel.get("player");

        if (force == undefined || !force) {
            if (player.Games != undefined && player.Games != null) {
                thisModel.trigger("games-loaded");
                return;
            }
        }

        thisModel.trigger("games-loading");

        $.get("/Steam/GamesBySteamId/" + player.SteamId, function (games, textStatus, jqXHR) {

            var player = thisModel.get("player");

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
        var player = thisModel.get("player");

        // if we aren't forced and we already have friends, just offer those up
        if (force != undefined || !force) {
            if (player.Friends != undefined || player.Friends != null) {
                thisModel.trigger("friends-loaded");
                return;
            }
        }

        this.trigger("friends-loading");
        $.get("/Steam/FriendsBySteamId/" + player.SteamId, function (friends, textStatus, jqXHR) {
            var player = thisModel.get("player");

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
        var player = this.model

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
                gamesHtml += gameItemTemplate(game);
            }

            this.$el.html(gamesHtml);
            this.$el.addClass("current-player-games");
        }
    },
    renderFail: function () {
        this.$el.html(this.failTemplate());
    }
});


// Displays friend information for the current player
var FriendsView = Backbone.View.extend({
    events: {
        "click .refresh-friends": "refresh"
    },

    initialize: function () {
        _.bindAll(this, "render", "renderFail");
        this.listenTo(this.model, "friends-loading", this.render);
        this.listenTo(this.model, "friends-loaded", this.render);
        this.listenTo(this.model, "friends-load-failed", this.renderFail);

        this.render();
    },

    template: _.template($("#_friendItemTemplate").html()),
    loadingTemplate: _.template($("#_friendsLoadingTemplate").html()),
    failTemplate: _.template($("#_friendsLoadFailedTemplate").html()),

    refresh: function () {
        this.model.loadFriends();
    },

    render: function () {
        var player = this.model.get("player");

        if (player.Friends == undefined || player.Friends == null) {
            this.$el.html(this.loadingTemplate());
        } else {
            var friendHtml = "";
            for (i in player.Friends)
                friendHtml += friendItemTemplate(player.Friends[i]);

            this.$el.html(friendHtml);
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
        var player = this.model.get("player");

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
                gamesHtml += gameItemTemplate(game);
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

    render: function () {
        var playerModel = this.model.get("player");
        if (playerModel != undefined) {
            var html = this.template(playerModel);
            this.$el.html(html);

            $(".main-app-window").fadeIn(500);

            // load friends
            if (window.friendsView != undefined && window.friendsView != null)
                window.friendsView.remove();

            window.friendsView = new FriendsView({ model: this.model });
            $("#_friendList").append(window.friendsView.$el);
            this.model.loadFriends();

            if (window.gamesView != undefined && window.gamesView != null)
                window.gamesView.remove();

            window.gamesView = new GamesView({ model: this.model })
            $("#_gameList").append(window.gamesView.$el);

            this.model.loadGames();
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
        var playerModel = this.model.get("player");
        if (playerModel != undefined) {

        }
    }
});

// instance the steam object
window.steam = new Steam();

window.currentPlayerSteamId = null;
window.currentPlayer = null;
window.friendSteamIds = null;

///
/// Helper function clear the current player info container and appends the given element as a child
///
function applyElementToPlayerInfo(element) {

    $("#currentPlayerInfo")
            .children().remove()
            .end()
            .append(element).hide().fadeIn(500);
}

///
/// Displays the given game list for the user
///
function loadGames(games, displayAll) {
    // setup games
    var gameHtml = "";
    for (i in games) {
        var game = games[i];
        if (game.Count == undefined)
            game.Count = 0;
        if (game.Total == undefined)
            game.Total = 0;
        gameHtml += gameItemTemplate(game);
    }

    var root = $("#_gameList");
    root
        .children().remove()
        .end()
        .append($(gameHtml));
    if (displayAll)
        root.addClass("current-player-games");
    else
        root.removeClass("current-player-games");

    if (gameHtml != "") {
        $("#_gameList").children().tsort({ order: 'desc', attr: 'data-count' });
    }
}

///
/// Loads the current player's game collection
///
function loadCurrentPlayerGames() {
    loadGames(currentPlayer.Games, true);
}

///
/// Called after a successful retrieval of the current player, populating their friend and game list
///
function loadCurrentPlayerSuccess(player) {

    // save the current player SteamId for later
    currentPlayer = player;

    applyElementToPlayerInfo($(playerProfileTemplate(player)));

    // setup friends
    var friendHtml = "";
    for (i in player.Friends)
        friendHtml += friendItemTemplate(player.Friends[i]);

    $("#_friendList")
        .children().remove()
        .end()
        .append($(friendHtml));

    loadGames(player.Games, true);

    $(".main-app-window").fadeIn(500);
}

///
/// Utility function for strings that remove leading and trailing whitespace
///
String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, "");
}

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
/// Returns true if the complete list of friends is fully loaded; otherwise, returns false
///
function areFriendsFullyLoaded() {
    for (i in friendSteamIds) {
        if (!steam.isPlayerInCacheWithGameData(friendSteamIds[i]))
            return false;
    }
    return true;
}

///
/// Calculates the right-side game list from the current selection, performing async update when needed
///
function calculateGameList() {

    friendSteamIds = [];

    var selectedElements = $(".friend-list .selected");

    // if we have no friends, then just show our collection
    if (selectedElements.length == 0) {
        loadCurrentPlayerGames();
        return;
    }

    selectedElements.each(function () {
        var playerListItem = $(this);
        playerListItem.attr("data-loading", "true");
        playerListItem.addClass("loading");
        var steamId = playerListItem.attr("data-id");
        friendSteamIds.push(steamId);
        steam.getPlayerGamesBySteamId(steamId,
            function () {

                // hide the loader image since we're done loading
                playerListItem.removeClass("loading");

                // if all friends are not loaded, then we must try again later
                if (!areFriendsFullyLoaded())
                    return;

                // perform the comparison and display the results
                var comparison = new GameCollectionComparison(currentPlayer);
                loadGames(comparison.games);
            });
    });
}

///
/// Called when the application first loads, performing first-time setup
///
function load() {

    // templates (specified in index.cshtml)
    playerProfileTemplate = _.template($("#_currentPlayerProfileTemplate").html());
    playerProfileLoadingTemplate = _.template($("#_currentPlayerProfileLoadingTemplate").html());
    friendItemTemplate = _.template($("#_friendItemTemplate").html());
    gameItemTemplate = _.template($("#_gameItemTemplate").html());

    // events
    $("#connect").click(loadCurrentPlayer);

    var debouncedLoadCurrentPlayer = _.debounce(loadCurrentPlayer, 500);

    $("#username").keyup(debouncedLoadCurrentPlayer);

    $(".friend-list-item").live("click", function () {
        $(this).toggleClass("selected");
        calculateGameList();
    });

    // kick off in the event of carried over value (like in firefox reload)
    loadCurrentPlayer();
}

// fire the load function on document ready
$(load);