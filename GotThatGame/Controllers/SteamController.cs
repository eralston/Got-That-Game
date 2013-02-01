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
    //var api_key = "CF9A7722D2B3BF4AAE1437C6D5FED194";

    //function getSteamId(friendlyName) {
    //    // http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=CF9A7722D2B3BF4AAE1437C6D5FED194&vanityurl=eralston
    //}

    //function getProfile(steamId) {
    //    // http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=CF9A7722D2B3BF4AAE1437C6D5FED194&steamids=76561197981883201
    //}

    //// returns a list of steam IDs
    //function getFriends(steamId) {
    //    // http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=CF9A7722D2B3BF4AAE1437C6D5FED194&steamid=76561197981883201&relationship=friend
    //}

    //// returns an array of games for the given steam di
    //function getGames(steamid) {
    //    //h ttp://steamcommunity.com/id/eralston/games?tab=all&xml=1
    //}

    //window.Steam = {
    //    apiKey : "CF9A7722D2B3BF4AAE1437C6D5FED194",

    //    getSteamId: function(friendlyName, success, failure) {
    //        $.getJSON("http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + this.apiKey + "&vanityurl=" + friendlyName, function(ret){
    //            success(ret.response.steamid);
    //        }).error(failure);
    //    },

    //    getPlayer : function (friendlyName) {

    //    }
    //};

    public class SteamController : Controller
    {
        

        /// <summary>
        /// Retrieves the steam ID (convoluted number) for the given friendly name
        /// </summary>
        /// <param name="id">friendly Steam name (EG, eralston)</param>
        /// <returns></returns>
        [HttpGet]
        public string SteamIdByFriendlyName(string id)
        {
            return Player.GetSteamIdByFriendlyName(id);
        }

        [HttpGet]
        public JsonResult UserProfileByFriendlyName(string id)
        {
            var profile = Player.GetPlayerByFriendlyName(id);
            return Json(profile, JsonRequestBehavior.AllowGet); 
        }

        [HttpGet]
        private JsonResult UserProfileBySteamId(string id)
        {
            var profile = Player.GetPlayerBySteamId(id);
            return Json(profile, JsonRequestBehavior.AllowGet);
        }
    }
}
