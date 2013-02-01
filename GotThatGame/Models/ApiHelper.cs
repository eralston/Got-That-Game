using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;

namespace GotThatGame.Models
{
    /// <summary>
    /// A static class for helper methods with the Steam API
    /// </summary>
    public static class ApiHelper
    {
        private static string _apiKey = null;

        /// <summary>
        /// Gets the Steam API key for this application (sontained in the SteamApiKey AppSetting)
        /// </summary>
        public static string ApiKey
        {
            get
            {
                if (string.IsNullOrEmpty(_apiKey))
                    _apiKey = ConfigurationManager.AppSettings["SteamApiKey"];

                return _apiKey;
            }
        }
    }
}