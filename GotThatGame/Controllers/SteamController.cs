using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Net;
using System.Web;
using System.Web.Mvc;

using Newtonsoft.Json;

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

    //// returns an array of games for the given steam id
    //function getGames(steamid) {
    //    // http://steamcommunity.com/id/eralston/games?tab=all&xml=1
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
        private const string ApiKey = "CF9A7722D2B3BF4AAE1437C6D5FED194";

        /// <summary>
        /// Returns the data stream for a GET on the given URL
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        private string GetResponseData(string url)
        {
            WebRequest request = WebRequest.Create(url);
            WebResponse response = request.GetResponse();
            using (Stream stream = response.GetResponseStream())
            {
                using (StreamReader reader = new StreamReader(stream))
                {
                    return reader.ReadToEnd();
                }
            }
        }

        /// <summary>
        /// Parses the given json string to find a single property value corresponding to the given property name
        /// </summary>
        /// <param name="json"></param>
        /// <param name="propertyName"></param>
        /// <returns></returns>
        private string GetPropertyValue(string json, string propertyName)
        {
            using (StringReader sReader = new StringReader(json))
            {
                using (JsonTextReader reader = new JsonTextReader(sReader))
                {
                    while (reader.Read())
                    {
                        // find the "steamid" node
                        if (reader.Value != null && reader.Value.ToString() == propertyName)
                        {
                            // hand back the next value
                            reader.Read();
                            return reader.Value.ToString();
                        }
                    }
                }
            }

            throw new Exception(string.Format("Could not find property '{0}'", propertyName));
        }

        /// <summary>
        /// Retrieves the steam ID (convoluted number) for the given friendly name
        /// </summary>
        /// <param name="id">friendly Steam name (EG, eralston)</param>
        /// <returns></returns>
        [HttpGet]
        public string SteamId(string id)
        {
            string url = string.Format("http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key={0}&vanityurl={1}", ApiKey, id);
            string json = GetResponseData(url);
            return GetPropertyValue(json, "steamid");
        }

        [HttpGet]
        public JsonResult UserProfile(string steamId)
        {
            return Json("", JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult UserFriends(string steamId)
        {
            return Json("", JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        public JsonResult UserGames(string steamId)
        {
            return Json("", JsonRequestBehavior.AllowGet);
        }
    }
}
