
function loadCurrentPlayerSuccess() {
    

}

function loadCurrentPlayer() {
    var username = $("#username").val();
    $.get("/Steam/CurrentUserPlayer/" + username, loadCurrentPlayerSuccess);
}


function load() {
    $("#connect").click(loadCurrentPlayer);
}

$(load);