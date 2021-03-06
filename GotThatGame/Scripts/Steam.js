﻿
// utility functions
function removeViewIfExists(view) {
    if (view != undefined && view != null)
        view.remove();
}

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
        _.bindAll(this);
        this.setSelected(false);
        this.setError();
    },

    cachePlayer: function (player) {
        window.playerCache.cachePlayer(player);
    },

    getError: function() {
        this.attributes.error;
    },

    setError: function(txt) {
        if (txt == undefined)
            txt = "";

        this.set({ error: txt });
    },

    setSelected: function (selected) {
        this.set({ selected: selected });
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

    isFetchingGames: function () {
        var val = this.get("fetchingGames");
        if (val == undefined)
            return false;
        return val;
    },

    didFailToLoadGames: function () {
        var val = this.get("gameLoadFailed");
        if (val == undefined)
            return false;
        return val;
    },

    setFetchingGames: function (fetching, gameLoadFailed) {
        this.set({ fetchingGames: fetching });
        if (gameLoadFailed == undefined)
            gameLoadFailed = false;
        this.set({ gameLoadFailed: gameLoadFailed });
    },

    getFriends: function () {
        return this.get("Friends");
    },

    setFriends: function (friendHeaders) {
        if (friendHeaders == undefined || friendHeaders == null)
            return;

        var player = this.getPlayer();
        player.Friends = friendHeaders;
        this.setPlayer(player);

        var FriendCollection = Backbone.Collection.extend({ model: Player });
        var friends = new FriendCollection();

        // iterate over the friends collection
        for (i in friendHeaders) {

            // pull out the friend and cache the data
            var friend = friendHeaders[i];
            window.playerCache.cachePlayer(friend);

            // wrap it in a model and add it to this collection
            var friendModel = new Player();
            friendModel.loadByPlayerHeader(friend);
            friends.add(friendModel);

        }

        this.set({ Friends: friends });
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
                this.setFriends(player.Friends);
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
                this.setFriends(player.Friends);
                this.trigger("header-loaded");
                return;
            }
        }

        // if we can't, then fall back to web services
        this.trigger("header-loading");
        $.get("/Steam/PlayerBySteamId/" + steamId, this.loadDone);
    },

    loadDone: function (player, textStatus, jqXHR) {

        if (player.ErrorText) {
            this.trigger("header-load-failed");
            return;
        }

        // load this object
        this.setPlayer(player);

        // trigger listeners
        this.trigger("header-loaded");
    },

    // Loading games

    loadGames: function (force) {
        var thisModel = this;

        if (thisModel.isFetchingGames())
            return;

        var player = thisModel.getPlayer();

        if (force == undefined || !force) {
            if (player.Games != undefined && player.Games != null) {
                thisModel.trigger("games-loaded");
                return;
            }
        }

        thisModel.trigger("games-loading");

        thisModel.setFetchingGames(true);
        $.get("/Steam/GamesBySteamId/" + player.SteamId, function (games, textStatus, jqXHR) {

            if (games.ErrorText != undefined) {
                thisModel.setError(games.ErrorText);
                thisModel.setFetchingGames(false, true);
                thisModel.trigger("games-load-failed");
                return;
            }

            var player = thisModel.getPlayer();

            player.Games = games;
            player.GamesHash = window.gameHasher.createGameHash(games);

            thisModel.setPlayer(player);
            thisModel.setFetchingGames(false);
            thisModel.trigger("games-loaded");
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

            if (friends.ErrorText != undefined) {
                thisModel.setError(friends.ErrorText);
                thisModel.trigger("friends-load-failed");
                return;
            }

            var player = thisModel.getPlayer();
            thisModel.setFriends(friends);

            thisModel.trigger("friends-loaded");
        });
    }
});

// model for comparing game collections between sets of players
var ComparisonModel = Backbone.Model.extend({

    initialize: function () {
        _.bindAll(this);
        this.set({ players: {} });
        this.debouncedCompare = _.debounce(function () { window.currentPlayerView.comparisonModel.compare(); }, 1000);
    },

    setPlayer: function (player) {
        if (player == undefined)
            return;

        this.set({ player: player });
        var friends = player.getFriends();

        if (friends == undefined)
            return;

        friends.on("change:selected", this.startCompare);
        friends.on("games-loaded", this.playerLoaded);
        friends.on("games-load-failed", this.playerLoadFailed);
    },

    getPlayer: function () {
        return this.get("player");
    },

    getComparisonFriends: function () {
        var player = this.getPlayer();
        return player.getFriends().where({ selected: true });
    },

    getGames: function () {
        return this.get("games");
    },

    startCompare: function () {

        var selectedFriends = this.getComparisonFriends();

        if (selectedFriends.length == 0) {
            this.trigger("no-comparison");
        } else {
            this.trigger("comparison-started");
            this.debouncedCompare();
        }
    },

    // starts the comparison, async completing on the "comparison-complete" event
    compare: function (a, b, c) {

        var selectedFriends = this.getComparisonFriends();

        for (i in selectedFriends)
            selectedFriends[i].loadGames();
    },

    areAllFriendsLoaded: function () {
        var friends = this.getComparisonFriends();
        for (i in friends) {
            var friendModel = friends[i];
            var friend = friendModel.getPlayer();
            if (friend.Games == undefined || friend.Games == null)
                return false;
        }
        return true;
    },

    ///
    /// Increments the value at the given key within the given hash
    ///
    incrementHashAtKey: function (key, comparisonHash) {
        if (!(key in comparisonHash))
            comparisonHash[key] = 1;
        else
            comparisonHash[key] = 1 + comparisonHash[key];
    },

    ///
    /// Accumulates the count of shared games between the two player objects, modifying the given count hash
    ///
    accumulateCount: function (player, comparisonHash) {
        for (appId in player.GamesHash) {
            this.incrementHashAtKey(appId, comparisonHash);
        }
    },

    ///
    /// Called when a player's games are loaded and we conditionally perform the comparison if they are complete
    ///
    playerLoaded: function () {

        // check if we're still waiting
        if (!this.areAllFriendsLoaded()) {
            this.trigger("comparison-continues");
            return;
        }

        var comparisonHash = {};

        // perform the collection comparison

        // count the player
        this.accumulateCount(this.getPlayer().getPlayer(), comparisonHash);
        var friends = this.getComparisonFriends();
        // accumulate the friends
        for (i in friends) {
            var friend = friends[i];
            this.accumulateCount(friend.getPlayer(), comparisonHash);
        }

        // set the result of the accumulation
        var games = window.gameHasher.getGamesWithCounts(comparisonHash, friends.length + 1);
        this.set({ games: games });
        this.trigger("comparison-complete");
    },

    ///
    /// Called when a player's collection fails to load, we have to check if that's a failure for the current group of players then optionally cry to the user
    ///
    playerLoadFailed: function () {
        var friends = this.getComparisonFriends();
        for (i in friends) {
            var friend = friends[i];
            if (friend.didFailToLoadGames()) {
                this.trigger("comparison-failed");
            }
        }
    },

    groupPlayerWithOrWithout: function (appId, player, friendsWith, friendsWithout) {
        if (appId in player.GamesHash)
            friendsWith.push(player);
        else
            friendsWithout.push(player);
    },

    ///
    /// Returns an object of the form { playerWith: [], playersWithout: [] } for a given appId and the current comparison group
    ///
    comparisonDetailsForAppId: function (appId) {

        var playersWith = [];
        var playersWithout = [];

        var player = this.getPlayer();
        this.groupPlayerWithOrWithout(appId, player.getPlayer(), playersWith, playersWithout);

        var friends = this.getComparisonFriends();
        for (i in friends) {
            var friend = friends[i].getPlayer();
            this.groupPlayerWithOrWithout(appId, friend, playersWith, playersWithout);
        }

        return { playersWith: playersWith, playersWithout: playersWithout };
    }
});

// Always pre-load the templates for better performance
var comparisonTemplate = _.template($("#_gameItemTemplate").html());
var comparisonLoadingHeaderTemplate = _.template($("#_comparisonLoadingTemplate").html());
var comparisonLoadingTemplate = _.template($("#_friendItemTemplate").html());
var comparisonFailTemplate = _.template($("#_comparisonFailedTemplate").html());

var comparisonFriendWithoutTemplate = _.template($("#_comparisonFriendWithoutTemplate").html());
var comparisonFriendWithTemplate = _.template($("#_comparisonFriendWithTemplate").html());
var comparisonDetailTemplate = _.template($("#_comparisonDetailTemplate").html());

///
/// A view for the right-side of the screen when performing a comparison
///
var ComparisonView = Backbone.View.extend({

    className: "game-comparison",

    events: {
        "click .refresh": "refresh",
        "hover .game-list-item": "compareDetails"
    },

    initialize: function () {

        _.bindAll(this);
        this.listenTo(this.model, "comparison-started", this.renderLoading);
        this.listenTo(this.model, "comparison-complete", this.renderResult);
        this.listenTo(this.model, "comparison-failed", this.renderFail);
    },

    template: comparisonTemplate,
    loadingHeaderTemplate: comparisonLoadingHeaderTemplate,
    loadingTemplate: comparisonLoadingTemplate,
    failTemplate: comparisonFailTemplate,
    friendWithTemplate:  comparisonFriendWithTemplate,
    friendWithoutTemplate: comparisonFriendWithoutTemplate,
    comparisonDetailTemplate: comparisonDetailTemplate,

    refresh: function () {
        this.model.compare();
    },

    renderLoading: function () {

        var friends = this.model.getComparisonFriends();
        var html = "";
        html += this.loadingHeaderTemplate();
        for (i in friends) {
            html += this.loadingTemplate(friends[i].getPlayer());
        }
        this.$el.html(html);
    },

    renderResult: function () {
        var games = this.model.getGames();
        var html = "";
        for (i in games) {
            html += this.template(games[i]);
        }
        this.$el.html(html);
        this.$el.children().tsort({ order: 'desc', attr: 'data-count' });
    },

    renderFail: function () {

        this.$el.html(this.failTemplate())
    },

    compareDetails: function (event) {
        var $this = $(event.currentTarget);
        var hasMenu = $this.find(".comparison-detail-popup").length > 0;
        if (hasMenu)
            return;
        var appId = $this.attr("data-app-id");
        var comparisonDetails = this.model.comparisonDetailsForAppId(appId);
        var html = "";
        // load friends without
        for (i in comparisonDetails.playersWithout) {
            var playerWithout = comparisonDetails.playersWithout[i];
            html += this.friendWithoutTemplate(playerWithout);
        }
        // load friends with
        for (i in comparisonDetails.playersWith) {
            var playerWith = comparisonDetails.playersWith[i];
            html += this.friendWithTemplate(playerWith);
        }
        var html = this.comparisonDetailTemplate({ Html: html });
        $this.append($(html));
    }
});

var friendTemplate = _.template($("#_friendItemTemplate").html());

// View for one row in the friends list
var FriendView = Backbone.View.extend({
    events: {
        "click .refresh": "refresh",
        "click": "toggle"
    },

    initialize: function () {
        _.bindAll(this);

        this.listenTo(this.model, "games-loading", this.showProgress);
        this.listenTo(this.model, "games-loaded", this.hideProgress);
        this.listenTo(this.model, "games-load-failed", this.showError);

        this.render();
    },

    refresh: function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.model.loadGames();
    },

    template: friendTemplate,

    showProgress: function () {
        this.hideError();
        this.$el.find(".friend-list-item").addClass("loading");
    },

    hideProgress: function () {
        this.$el.find(".friend-list-item").removeClass("loading");
    },

    showError: function () {
        this.hideProgress();
        this.$el.find(".friend-list-item").addClass("error");
        var txt = this.model.attributes.error;
        this.$el.find(".friend-error-text").html(txt);
    },

    hideError: function () {
        this.hideProgress();
        this.$el.find(".friend-list-item").removeClass("error");
    },

    render: function () {
        this.$el.html(this.template(this.model.getPlayer()));
    },

    // event handlers

    toggle: function () {
        var $this = this.$el;
        $this.toggleClass("selected");
        this.model.setSelected($this.hasClass("selected"));
    }
});

var friendTemplate = _.template($("#_friendItemTemplate").html());
var friendLoadingTemplate = _.template($("#_friendsLoadingTemplate").html());
var friendFailTemplate = _.template($("#_friendsLoadFailedTemplate").html());

// Displays friend information for the current player
var FriendsView = Backbone.View.extend({
    className: "friend-view",

    events: {
    },

    initialize: function () {
        _.bindAll(this);

        this.listenTo(this.model, "friends-loading", this.renderLoading);
        this.listenTo(this.model, "friends-loaded", this.renderFriends);
        this.listenTo(this.model, "friends-load-failed", this.renderFail);
    },

    template: friendTemplate,
    loadingTemplate: friendLoadingTemplate,
    failTemplate: friendFailTemplate,

    renderLoading: function () {
        this.$el.html(this.loadingTemplate());
    },
    renderFriends: function () {
        var friendCollection = this.model.getFriends();
        var friendsView = this;
        friendsView.$el.children().remove();
        friendCollection.each(function (friend) {
            var view = new FriendView({ model: friend });
            friendsView.$el.append(view.$el);
        });
    },
    renderFail: function () {
        this.$el.html(this.failTemplate());
    }
});

var gameTemplate = _.template($("#_gameItemTemplate").html());
var gameLoadingTemplate = _.template($("#_gamesLoadingTemplate").html());
var gameFailTemplate = _.template($("#_gamesLoadFailedTemplate").html());

var GamesView = Backbone.View.extend({
    events: {
        "click .refresh-games": "refresh"
    },

    initialize: function () {
        _.bindAll(this);
        this.listenTo(this.model, "games-loading", this.render);
        this.listenTo(this.model, "games-loaded", this.render);
        this.listenTo(this.model, "games-load-failed", this.renderFail);

        this.render();
    },

    template: gameTemplate,
    loadingTemplate: gameLoadingTemplate,
    failTemplate: gameFailTemplate,

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

var currentPlayerTemplate = _.template($("#_currentPlayerProfileTemplate").html());

// Displays information for the current player at the top of the page
var CurrentPlayerView = Backbone.View.extend({

    events: {
    },

    initialize: function () {
        _.bindAll(this, "render");
        this.listenTo(this.model, "header-loaded", this.render);
        this.listenTo(this.model, "friends-loaded", this.loadCurrentPlayerComparison);
    },

    template: currentPlayerTemplate,

    loadCurrentPlayerGameColletion: function () {

        removeViewIfExists(this.gameView);

        this.gameView = new GamesView({ model: this.model });
        $("#_gameList").append(this.gameView.$el);

        this.model.loadGames();
    },

    loadCurrentPlayerFriends: function () {

        removeViewIfExists(this.friendsView);

        this.friendsView = new FriendsView({ model: this.model });
        $("#_friendList").append(this.friendsView.$el);
        this.model.loadFriends();
    },

    loadCurrentPlayerComparison: function () {

        removeViewIfExists(this.comparisonView);

        this.comparisonModel = new ComparisonModel();
        var thisView = this;
        this.comparisonModel.on("no-comparison", function () { thisView.showGameCollection(true); });
        this.comparisonModel.on("comparison-started", function () { thisView.showGameCollection(false); });

        this.comparisonModel.setPlayer(this.model);
        this.comparisonView = new ComparisonView({ model: this.comparisonModel });
        $("#_comparison").append(this.comparisonView.$el);
    },

    render: function () {
        var playerModel = this.model.getPlayer();
        if (playerModel != undefined) {
            var html = this.template(playerModel);
            this.$el.html(html);

            $(".main-app-window").fadeIn(500);

            this.loadCurrentPlayerGameColletion();
            this.loadCurrentPlayerFriends();
            this.showGameCollection(true);
        }
    },

    showGameCollection: function (show) {
        if (show) {
            if (this.comparisonView != undefined)
                this.comparisonView.$el.hide();
            this.gameView.$el.show();
        } else {
            if (this.comparisonView != undefined)
                this.comparisonView.$el.show();
            this.gameView.$el.hide();
        }
    },
});

// add a little popup for showing who has and does not have a particular game
$(".game-comparison .game-list-item").live("hover", function () {
    window.currentPlayerView.comparisonModel
});

function setupAndGetUsername() {
    var username = $("#username").val();
    username = username.trim();

    if (username == "")
        return undefined;

    window.currentPlayerModel = new Player();

    removeViewIfExists(window.currentPlayerView);

    window.currentPlayerView = new CurrentPlayerView({ model: window.currentPlayerModel });
    $("#currentPlayerInfo").append(window.currentPlayerView.$el);

    return username;
}

function loadCurrentPlayerBySteamId() {
    var username = setupAndGetUsername();
    if (username == undefined)
        return;
    window.currentPlayerModel.loadBySteamId(username);
}

///
/// Clears the UI of its current state, then asynchronously loads up a new user given the state of the username input
///
function loadCurrentPlayerByFriendlyName() {
    
    var username = setupAndGetUsername();
    if (username == undefined)
        return;
    window.currentPlayerModel.loadByFriendlyName(username);
}