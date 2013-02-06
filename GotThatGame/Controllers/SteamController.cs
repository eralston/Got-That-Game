using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Net;
using System.Web;
using System.Web.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using GotThatGame.Models;

namespace GotThatGame.Controllers
{
    /// <summary>
    /// Controller for accessing the Steam API via JavaScript
    /// </summary>
    public class SteamController : Controller
    {
        /// <summary>
        /// Given a friendly name (AKA Vanity URL), returns a fully loaded player object with friends and games
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult CurrentUserPlayer(string id)
        {
            Player currentPlayer = Player.GetPlayerByFriendlyName(id);
            currentPlayer.LoadFriends();
            currentPlayer.LoadGames();
            return Json(currentPlayer, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Given a friendly name, returns the collection of games for that user
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult GamesBySteamId(string id)
        {
            var games = Game.GetGamesForPlayer(id);
            return Json(games, JsonRequestBehavior.AllowGet);
        }
    }
}
