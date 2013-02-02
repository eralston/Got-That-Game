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
        private static string GetGamesListXmlForFriendlyName(string friendlyName)
        {
            string url = string.Format("http://steamcommunity.com/id/{0}/games?tab=all&xml=1", friendlyName);
            for (int i = 0; i < 10; ++i)
            {
                var response = WebRequestHelper.GetResponseData(url);
                if (response != null)
                    return response;
            }

            return null;
        }

        /// <summary>
        /// Calls the Steam API to get a given player's game list, then returns it as an IEnumerable of the game type
        /// </summary>
        /// <param name="friendlyName"></param>
        /// <returns></returns>
        public static IEnumerable<Game> GetGamesForPlayer(string friendlyName)
        {
            XmlDocument doc = new XmlDocument();
            string xml = GetGamesListXmlForFriendlyName(friendlyName);
            doc.LoadXml(xml);
            XmlNodeList list = doc.GetElementsByTagName("game");

            List<Game> games = new List<Game>();
            foreach (XmlNode node in list)
            {
                Game game = new Game(node);
                games.Add(game);
            }

            return games;
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