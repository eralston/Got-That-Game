﻿using System;
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
        /// Given a friendly name (AKA Vanity URL), returns a header for the player
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        [OutputCache(CacheProfile = "InstantById")]
        public JsonResult PlayerByFriendlyName(string id)
        {
            try
            {
                Player currentPlayer = Player.GetPlayerByFriendlyName(id);
                currentPlayer.FriendlyName = id;
                return Json(currentPlayer, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new Error(ex), JsonRequestBehavior.AllowGet);
            }
        }

        /// <summary>
        /// Given a Steam ID, returns a header for a player
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        [OutputCache(CacheProfile = "InstantById")]
        public JsonResult PlayerBySteamId(string id)
        {
            try
            {
                Player currentPlayer = Player.GetPlayerBySteamId(id);
                return Json(currentPlayer, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new Error(ex), JsonRequestBehavior.AllowGet);
            }
        }

        /// <summary>
        /// Given a Steam ID, pulls the list of friend player headers
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        [OutputCache(CacheProfile = "InstantById")]
        public JsonResult FriendsBySteamId(string id)
        {

            try
            {
                IEnumerable<Player> friends = Player.GetFriendsOfPlayerBySteamId(id);
                return Json(friends, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new Error(ex), JsonRequestBehavior.AllowGet);
            }
        }

        /// <summary>
        /// Given a friendly name, returns the collection of games for that user
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        [OutputCache(CacheProfile = "InstantById")]
        public JsonResult GamesBySteamId(string id)
        {
            try
            {
                var games = Game.GetGamesForPlayer(id);
                return Json(games, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new Error(ex), JsonRequestBehavior.AllowGet);
            }
        }
    }
}
