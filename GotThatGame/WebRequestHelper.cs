using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Net;
using System.Web;
using System.Web.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace GotThatGame
{
    public static class WebRequestHelper
    {
        /// <summary>
        /// Returns the data stream for a GET on the given URL
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        public static string GetResponseData(string url)
        {
            try
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
            catch
            {

                return null;
            }
        }
    }
}