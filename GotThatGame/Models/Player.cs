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
        public static Player GetPlayerByFriendlyName(string friendlyName)
        {
            string steamId = GetSteamIdByFriendlyName(friendlyName);
            return GetPlayerBySteamId(steamId);
        }

        /// <summary>
        /// Creates a PlayerProfile instance for a given steam ID
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <returns></returns>
        public static Player GetPlayerBySteamId(string id)
        {
            string url = string.Format("http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={0}&steamids={1}", ApiHelper.ApiKey, id);
            string json = WebRequestHelper.GetResponseData(url);
            JArray players = JObject.Parse(json)["response"]["players"] as JArray;
            JObject player = players[0] as JObject;
            return player.ToObject<Player>();
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
                    _friendlyName = ProfileUrl.Replace("http://steamcommunity.com/id/eralston/", "");
                    _friendlyName = _friendlyName.Substring(0, _friendlyName.Length - 2);
                }

                return _friendlyName;
            }
            set { _friendlyName = value; }
        }

        #endregion

        #region Properties Pulled from Other Web Services

        private IEnumerable<string> _friendSteamIds;

        [DataMember]
        public IEnumerable<string> FriendSteamIds
        {
            get
            {
                if (_friendSteamIds == null)
                {
                    
                }

                return _friendSteamIds;
            }
            set
            {
                _friendSteamIds = value;
            }
        }

        IEnumerable<Game> _gameList = null;

        [DataMember]
        public IEnumerable<Game> GameList
        {
            get
            {
                if (_gameList == null)
                {
                    //init
                    _gameList = Game.GetGamesForPlayer(FriendlyName);
                }

                return _gameList;
            }
            set
            {
                _gameList = value;
            }
        }

        #endregion
    }
}