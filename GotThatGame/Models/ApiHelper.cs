using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;

namespace GotThatGame.Models
{
    /// <summary>
    /// An Exception sub-classes for validation errors with Steam API values
    /// </summary>
    public class SteamValidationException : Exception
    {
        public SteamValidationException(string message)
            : base(message)
        {
        }
    }

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

        /// <summary>
        /// Validates the given XML inpit, throwing an exception if the response seems invalid
        /// </summary>
        /// <param name="xml"></param>
        public static void ValidateXml(string xml)
        {
            // if the XML is null, then we failed to get a response
            if (string.IsNullOrEmpty(xml))
                throw new SteamValidationException("Failed to retrieve XML response from server, please try again");

            // if this isn't HTML, then we're out of validation rules
            if (!xml.StartsWith("<!DOCTYPE"))
                return;

            // If this is HTML and has this phrase, then it is the denial because the person has a private profile
            if (xml.Contains("This profile is private."))
                throw new SteamValidationException("Unable to query information, profile is private");
        }
    }
}