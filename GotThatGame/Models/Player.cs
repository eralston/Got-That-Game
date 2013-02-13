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
            return GetFriendsOfPlayerBySteamId(player.SteamId);
        }

        /// <summary>
        /// Gets a list of player object values for the given steamId
        /// </summary>
        /// <param name="steamId"></param>
        /// <returns></returns>
        public static IEnumerable<Player> GetFriendsOfPlayerBySteamId(string steamId)
        {
            List<Player> ret = new List<Player>();
            IEnumerable<string> friendSteamIds = GetFriendSteamIds(steamId);
            foreach (string friendSteamId in friendSteamIds)
            {
                ret.Add(GetPlayerBySteamId(friendSteamId, false));
            }
            return ret.OrderBy(p => p.Name);
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
            _games = Game.GetGamesForPlayer(SteamId);
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