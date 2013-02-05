
var playerProfileTemplate = null;
var playerProfileLoadingTemplate = null;
var friendItemTemplate = null;
var gameItemTemplate = null;

function applyElementToPlayerInfo(element) {
    $("#currentPlayerInfo")
            .children().remove()
            .end()
            .append(element);
}

function loadCurrentPlayerSuccess(player, textStatus, jqXHR) {
    applyElementToPlayerInfo($(playerProfileTemplate(player)));

    // setup friends
    var friendHtml = "";
    for (i in player.Friends) {
        var friend = player.Friends[i];
        friend.FriendlyName = friend.FriendlyName || friend.Name;
        friendHtml += friendItemTemplate(friend);
    }
    $("#_friendList")
        .children().remove()
        .end()
        .append($(friendHtml));

    // setup games
    var gameHtml = "";
    for (i in player.Games) {
        var game = player.Games[i];
        gameHtml += gameItemTemplate(game);
    }
    $("#_gameList")
        .children().remove()
        .end()
        .append($(gameHtml));
}

function loadCurrentPlayer() {
    var username = $("#username").val();
    applyElementToPlayerInfo($(playerProfileLoadingTemplate({ Name: username })));
    $.get("/Steam/CurrentUserPlayer/" + username, loadCurrentPlayerSuccess);
}

function load() {
    $("#connect").click(loadCurrentPlayer);

    playerProfileTemplate = _.template($("#_currentPlayerProfileTemplate").html());
    playerProfileLoadingTemplate = _.template($("#_currentPlayerProfileLoadingTemplate").html());
    friendItemTemplate = _.template($("#_friendItemTemplate").html());
    gameItemTemplate = _.template($("#_gameItemTemplate").html());
}

$(load);