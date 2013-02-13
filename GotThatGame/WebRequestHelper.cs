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
    /// <summary>
    /// Statis helper class for making web requests
    /// </summary>
    public static class WebRequestHelper
    {
        /// <summary>
        /// Static constructor
        /// Called only once on first static method call
        /// </summary>
        static WebRequestHelper()
        {
            System.Net.ServicePointManager.Expect100Continue = false;
        }

        /// <summary>
        /// Returns the data stream for a GET on the given URL
        /// </summary>
        /// <param name="url"></param>
        /// <returns></returns>
        public static string GetResponseData(string url)
        {
            try
            {
                HttpWebRequest request = WebRequest.Create(url) as HttpWebRequest;

                request.AllowAutoRedirect = true;
                request.Accept = "*/*";

                using (WebResponse response = request.GetResponse())
                {
                    using (Stream stream = response.GetResponseStream())
                    {
                        using (StreamReader reader = new StreamReader(stream))
                        {
                            return reader.ReadToEnd();
                        }
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