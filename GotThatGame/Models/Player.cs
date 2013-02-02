using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using GotThatGame.Controllers;

namespace GotThatGame.Models
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

    /// <summary>
    /// A serializable class for pulling a player's profile, friends, and games
    /// </summary>
    [DataContract]
    public class Player
    {
        #region Static Methods

        /// <summary>
        /// Returns the steam ID for a given friendly name (AKA Vanity URL in the steam docs)
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <returns></returns>
        public static string GetSteamIdByFriendlyName(string friendlyName)
        {
            string url = string.Format("http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key={0}&vanityurl={1}", ApiHelper.ApiKey, friendlyName);
            string json = WebRequestHelper.GetResponseData(url);
            return JsonHelper.GetPropertyValue(json, "steamid");
        }

        /// <summary>
        /// Create a PlayerProfile instance for the giveen friendly name
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <returns></returns>
        public static Player GetPlayerByFriendlyName(string friendlyName, bool loadFriends = false)
        {
            string steamId = GetSteamIdByFriendlyName(friendlyName);
            return GetPlayerBySteamId(steamId, loadFriends);
        }

        /// <summary>
        /// Creates a PlayerProfile instance for a given steam ID
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <returns></returns>
        public static Player GetPlayerBySteamId(string id, bool loadFriends = false)
        {
            string url = string.Format("http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={0}&steamids={1}", ApiHelper.ApiKey, id);
            string json = WebRequestHelper.GetResponseData(url);
            JArray players = JObject.Parse(json)["response"]["players"] as JArray;
            JObject player = players[0] as JObject;
            Player ret =  player.ToObject<Player>();
            return ret;
        }

        /// <summary>
        /// Makes a web service call to get the SteamIds
        /// </summary>
        /// <returns></returns>
        public static IEnumerable<string> GetFriendSteamIds(string steamId)
        {
            string url = string.Format("http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key={0}&steamid={1}&relationship=friend", ApiHelper.ApiKey, steamId);
            string json = WebRequestHelper.GetResponseData(url);
            return JsonHelper.GetAllValuesForProperty(json, "steamid");
        }

        /// <summary>
        /// Gets a list of player objects for this player's friends
        /// NOTE: The friends list for these players is NOT loaded
        /// </summary>
        /// <param name="player"></param>
        /// <returns></returns>
        public static IEnumerable<Player> GetFriendsOfPlayer(Player player)
        {
            List<Player> ret = new List<Player>();
            IEnumerable<string> friendSteamIds = GetFriendSteamIds(player.SteamId);
            foreach (string friendSteamId in friendSteamIds)
            {
                ret.Add(GetPlayerBySteamId(friendSteamId, false));
            }
            return ret;
        }

        #endregion

        #region Fields from JSON

        [DataMember(Name = "steamid")]
        public string SteamId { get; set; }

        [DataMember(Name = "personaname")]
        public string Name { get; set; }

        [DataMember(Name = "profileurl")]
        public string ProfileUrl { get; set; }

        [DataMember(Name = "avatar")]
        public string AvatarSmall { get; set; }

        [DataMember(Name = "avatarmedium")]
        public string AvatarLarge { get; set; }

        #endregion

        #region Properties Derived from JSON

        private string _friendlyName = null;

        /// <summary>
        /// Gets the "Friendly Name" for this player by parsing the ProfileUrl (which is also called the "Vanity URL" by the web API documentation)
        /// </summary>
        [DataMember]
        public string FriendlyName
        {
            get
            {
                if (string.IsNullOrEmpty(_friendlyName))
                {
                    // take the profile URL and chop out the vanity URL, which is the friendly name
                    _friendlyName = ProfileUrl.Replace("http://steamcommunity.com/id/", "");
                    _friendlyName = _friendlyName.Substring(0, _friendlyName.Length - 1);
                }

                return _friendlyName;
            }
            set { _friendlyName = value; }
        }

        #endregion

        #region Properties Pulled from Other Web Services

        IEnumerable<Player> _friends = null;

        /// <summary>
        /// Loads the optoional friends field for this object (otherwise it will be null)
        /// </summary>
        public void LoadFriends()
        {
            _friends = GetFriendsOfPlayer(this);
        }

        /// <summary>
        /// Contains a 
        /// </summary>
        [DataMember]
        public IEnumerable<Player> Friends
        {
            get
            {
                return _friends;
            }
            set { }
        }

        IEnumerable<Game> _games = null;

        /// <summary>
        /// Loads the optional games field for the current player (otherwise it will be null)
        /// </summary>
        public void LoadGames()
        {
            _games = Game.GetGamesForPlayer(FriendlyName);
        }

        [DataMember]
        public IEnumerable<Game> Games
        {
            get
            {
                return _games;
            }
            set { }
        }

        #endregion
    }
}