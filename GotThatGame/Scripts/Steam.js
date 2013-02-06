
// Global variables for page element templates
var playerProfileTemplate = null;
var playerProfileLoadingTemplate = null;
var friendItemTemplate = null;
var gameItemTemplate = null;



///
/// Constructor for a Steam object that proxies to the SteamController class
///
function Steam(errorCallback) {

    this.playerCache = {};
    this.playerGamesCache = {};
    var allGames = {};

    var createGameHash = function (arraysOfObjects, key) {
        var ret = {};
        for (i in arraysOfObjects) {
            var obj = arraysOfObjects[i];
            ret[obj[key]] = obj;
            // an accumulation of all games passing through the system
            allGames[obj[key]] = obj;
        }
        return ret;
    };

    this.getGamesWithCounts = function (hashCount) {
        var ret = [];
        for (appId in hashCount) {
            var count = hashCount[appId];
            var game = _.clone(allGames[appId]);
            game.count = count;
            ret.push(game);
        }
        return ret;
    };

    // CURRENT PLAYER (Player + Friends)

    ///
    /// Loads a current player object over AJAX, calling via friendly name (AKA vanity URL)
    ///
    this.getCurrentPlayerByFriendlyName = function (friendlyName, callback) {

        // check the cache and return from there if we have it
        var cache = this.playerCache;
        if (friendlyName in cache)
            callback(cache[friendlyName]);

        $.get("/Steam/CurrentUserPlayerByFriendlyName/" + friendlyName,
            function (player, textStatus, jqXHR) {
                
                // form cache of games
                player.GamesHash = createGameHash(player.Games, "AppId");

                // cache by both friendlyName and 
                cache[friendlyName] = player;
                cache[player.SteamId] = player;

                // if he brought friends, then also load them into the cache
                if (player.Friends != undefined) {
                    for (i in player.Friends) {
                        var friend = player.Friends[i];
                        cache[friend.SteamId] = friend;
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
        var cache = this.playerCache;
        if (steamId in cache)
            callback(cache[steamId]);

        $.get("/Steam/CurrentUserPlayerByFriendlyName/" + steamId,
            function (player, textStatus, jqXHR) {
                cache[steamId] = player;
                callback(player);
            });
    };

    ///
    /// Returns the cached value for the given SteamId (undefined if not available)
    ///
    this.getCachedPlayer = function (steamId) {
        return this.playerCache[steamId];
    }

    // GAMES

    ///
    /// Loads a player's game collection via AJAX
    ///
    this.getPlayerGamesBySteamId = function (steamId, callback) {

        var playerCache = this.playerCache;

        // check the cache and return from there if we have it
        var cache = this.playerGamesCache;
        if (steamId in cache) {
            callback(playerCache[steamId]);
        }

        // AJAX the game list
        $.get("/Steam/GamesBySteamId/" + steamId,
            function (games, textStatus, jqXHR) {
                cache[steamId] = games;
                var player = playerCache[steamId];
                player.Games = games;
                player.GamesHash = createGameHash(games, "AppId");
                callback(player);
            });

    };

    ///
    /// Checks if the given steamId is loaded in the cache
    ///
    this.isPlayerLoaded = function (steamId) {
        return steamId in this.playerCache;
    };
};

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
            .append(element);
}

function loadGames(games, displayAll) {
    // setup games
    var gameHtml = "";
    for (i in games) {
        var game = games[i];
        if (!displayAll && game.count <= 0)
            continue;
        gameHtml += gameItemTemplate(game);
    }

    $("#_gameList")
        .children().remove()
        .end()
        .append($(gameHtml));
}

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
}

///
/// Clears the UI of its current state, then asynchronously loads up a new user given the state of the username input
///
function loadCurrentPlayer() {

    var username = $("#username").val();
    applyElementToPlayerInfo($(playerProfileLoadingTemplate({ Name: username })));
    steam.getCurrentPlayerByFriendlyName(username, loadCurrentPlayerSuccess);
}

///
/// Returns true if the complete list of friends is fully loaded; otherwise, returns false
///
function areFriendsFullyLoaded() {
    for (i in friendSteamIds) {
        if (!steam.isPlayerLoaded(friendSteamIds[i]))
            return false;
    }
    return true;
}

///
/// Increments the value at the given key within the given hash
///
function incrementHashAtKey(hash, key) {
    if (!(key in hash))
        hash[key] = 1;
    else
        hash[key] = 1 + hash[key];
}

///
/// Accumulates the count of shared games between the two player objects, modifying the given count hash
///
function accumulateCount(currentPlayer, friend, countHash) {
    for (playerAppId in currentPlayer.GamesHash) {
        if (playerAppId in friend.GamesHash) {
            incrementHashAtKey(countHash, playerAppId);
        }
    }
}

///
/// Compares the game collections of the current player and the list of currently selected friends
///
function compareCollections() {
    var countHash = {};
    for (i in friendSteamIds) {
        var friend = steam.getCachedPlayer(friendSteamIds[i]);
        accumulateCount(currentPlayer, friend, countHash);
    }
    var games = steam.getGamesWithCounts(countHash);
    loadGames(games);
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
        playerListItem.find(".loader-image").addClass("loading");
        var steamId = playerListItem.attr("data-id");
        friendSteamIds.push(steamId);
        steam.getPlayerGamesBySteamId(steamId,
            function () {

                // hide the loader image since we're done loading
                playerListItem.find(".loader-image").removeClass("loading");

                // if all friends are not loaded, then we must try again later
                if (!areFriendsFullyLoaded())
                    return;

                compareCollections();
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

    $(".friend-list-item").live("click", function () {
        $(this).toggleClass("selected");
        calculateGameList();
    });
}

$(load);