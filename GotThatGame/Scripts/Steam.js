
// Global variables for page element templates
var playerProfileTemplate = null;
var playerProfileLoadingTemplate = null;
var friendItemTemplate = null;
var gameItemTemplate = null;

///
/// Helper function clear the current player info container and appends the given element as a child
///
function applyElementToPlayerInfo(element) {
    $("#currentPlayerInfo")
            .children().remove()
            .end()
            .append(element);
}

///
/// Called after a successful retrieval of the current player, populating their friend and game list
///
function loadCurrentPlayerSuccess(player, textStatus, jqXHR) {
    applyElementToPlayerInfo($(playerProfileTemplate(player)));

    // setup friends
    var friendHtml = "";
    for (i in player.Friends)
        friendHtml += friendItemTemplate(player.Friends[i]);

    $("#_friendList")
        .children().remove()
        .end()
        .append($(friendHtml));

    // setup games
    var gameHtml = "";
    for (i in player.Games)
        gameHtml += gameItemTemplate(player.Games[i]);
    
    $("#_gameList")
        .children().remove()
        .end()
        .append($(gameHtml));
}

///
/// Clears the UI of its current state, then asynchronously loads up a new user given the state of the username input
///
function loadCurrentPlayer() {
    var username = $("#username").val();
    applyElementToPlayerInfo($(playerProfileLoadingTemplate({ Name: username })));
    $.get("/Steam/CurrentUserPlayer/" + username, loadCurrentPlayerSuccess);
}

function calculateGameList() {
}

function toggleFriend() {
    $(this).toggleClass("selected");
    calculateGameList();
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

    $(".friend-list-item").live("click", toggleFriend);
    
}

$(load);