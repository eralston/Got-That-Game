using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Xml;
using System.Xml.Serialization;
using System.Web;

namespace GotThatGame.Models
{
    /// <summary>
    /// Class for both querying games and transporting them between server and client as JSON
    /// </summary>
    [DataContract]
    public class Game
    {
        #region Static Methods for Querying

        /// <summary>
        /// Calls the Steam web API to get a given player's (by friendly ID AKA Vanity URL) game list as an XML document
        /// NOTE: The API seems to be unreliable and this will attempt 10 times before giving up
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <returns></returns>
        private static string GetGamesListXmlForFriendlyName(string steamId)
        {
            // by steam ID: http://steamcommunity.com/profiles/76561197962215668/games/?tab=all&xml=1
            // by vanity URL: http://steamcommunity.com/id/eralston/games?tab=all&xml=1
            string url = string.Format("http://steamcommunity.com/profiles/{0}/games/?tab=all&xml=1", steamId);
            for (int i = 0; i < 10; ++i)
            {
                var response = WebRequestHelper.GetResponseData(url);
                if (response != null)
                    return response;
                else
                    System.Threading.Thread.Sleep(0);
            }

            return null;
        }

        /// <summary>
        /// Calls the Steam API to get a given player's game list, then returns it as an IEnumerable of the game type
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <returns></returns>
        public static IEnumerable<Game> GetGamesForPlayer(string steamId)
        {
            XmlDocument doc = new XmlDocument();
            string xml = GetGamesListXmlForFriendlyName(steamId);
            ApiHelper.ValidateXml(xml);
            doc.LoadXml(xml);
            XmlNodeList list = doc.GetElementsByTagName("game");

            List<Game> games = new List<Game>();
            foreach (XmlNode node in list)
            {
                Game game = new Game(node);
                games.Add(game);
            }

            return games.OrderBy(g => g.Name);
        }

        #endregion

        /// <summary>
        /// Constructor for receiving as DataContract
        /// </summary>
        public Game()
        {
        }

        /// <summary>
        /// Constructor used when parsing XML
        /// </summary>
        /// <param name="node"></param>
        public Game(XmlNode node)
        {
            foreach (XmlNode child in node.ChildNodes)
            {
                if (child.Name == "appID")
                    AppId = int.Parse(child.FirstChild.Value);
                else if (child.Name == "name")
                    Name = child.FirstChild.Value;
                else if (child.Name == "logo")
                    ImageUrl = child.FirstChild.Value;
                else if (child.Name == "storeLink")
                    StoreUrl = child.FirstChild.Value;
            }
        }

        #region Properties from XML

        [DataMember]
        public int AppId { get; set; }

        [DataMember]
        public string Name { get; set; }

        [DataMember]
        public string ImageUrl { get; set; }

        [DataMember]
        public string StoreUrl { get; set; }

        #endregion
    }
}