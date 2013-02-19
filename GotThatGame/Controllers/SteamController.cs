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
        public JsonResult CurrentUserPlayerByFriendlyName(string id)
        {
            Player currentPlayer = Player.GetPlayerByFriendlyName(id);
            currentPlayer.LoadFriends();
            currentPlayer.LoadGames();
            return Json(currentPlayer, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Given a friendly name (AKA Vanity URL), returns a header for the player
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult PlayerByFriendlyName(string id)
        {
            Player currentPlayer = Player.GetPlayerByFriendlyName(id);
            currentPlayer.FriendlyName = id;
            return Json(currentPlayer, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Given a Steam ID, returns a header for a player
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult PlayerBySteamId(string id)
        {
            Player currentPlayer = Player.GetPlayerBySteamId(id);
            return Json(currentPlayer, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Given a Steam ID, pulls the list of friend player headers
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult FriendsBySteamId(string id)
        {
            IEnumerable<Player> friends = Player.GetFriendsOfPlayerBySteamId(id);
            return Json(friends, JsonRequestBehavior.AllowGet);
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
