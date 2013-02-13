
// Global variables for page element templates
var playerProfileTemplate = null;
var playerProfileLoadingTemplate = null;
var friendItemTemplate = null;
var gameItemTemplate = null;

///
/// Constructor for a Steam object that proxies to the SteamController class
///
function Steam(errorCallback) {

    var playerCache = {};
    var allGames = {};

    ///
    /// Create a hash in the form (value of AppId property, object) for the given array of gamess
    /// As a side-effect, this keeps a list of games that have passed through the system
    ///
    var createGameHash = function (arraysOfObjects) {
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

///
/// Instances of this object encapsulate the process for game collection comparison between the given player and their friends
/// PRE-CONDITION: the game collection for the given player and every player object in their Friends attribute must be loaded from the service already
///
function GameCollectionComparison(currentPlayer) {

    var comparisonHash = {};

    ///
    /// Increments the value at the given key within the given hash
    ///
    var incrementHashAtKey = function (key) {
        if (!(key in comparisonHash))
            comparisonHash[key] = 1;
        else
            comparisonHash[key] = 1 + comparisonHash[key];
    }

    ///
    /// Accumulates the count of shared games between the two player objects, modifying the given count hash
    ///
    var accumulateCount = function (player) {
        for (appId in player.GamesHash) {
            incrementHashAtKey(appId);
        }
    }

    // perform the collection comparison

    // count the player
    accumulateCount(currentPlayer);

    // accumulate the friends
    for (i in friendSteamIds) {
        var friend = steam.getFromPlayerCache(friendSteamIds[i]);
        accumulateCount(friend);
    }

    // set the result of the accumulation
    this.games = steam.getGamesWithCounts(comparisonHash, friendSteamIds.length + 1);
};

// Model for players, including friends and games
var Player = Backbone.Model.extend({

    initialize: function () {
        _.bindAll(this, "load", "loadDone", "loadGames", "loadGamesDone","loadFriends", "loadFriendsDone");
    },

    load: function() {
    },
    loadDone: function() {
    },

    loadGames: function () {
    },
    loadGamesDone: function() {
    },


    loadFriends: function () {
    },
    loadFriendsDone: function () {
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
    applyElementToPlayerInfo($(playerProfileLoadingTemplate({ Name: username })));
    steam.getCurrentPlayerByFriendlyName(username, loadCurrentPlayerSuccess);
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