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
    public static class JsonHelper
    {
        /// <summary>
        /// Parses the given json string to find a single property value corresponding to the given property name
        /// </summary>
        /// <param name="json"></param>
        /// <param name="propertyName"></param>
        /// <returns></returns>
        public static string GetPropertyValue(string json, string propertyName)
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

            return null;
        }

        /// <summary>
        /// Returns a list of each unique value in a given json string with the given property name
        /// </summary>
        /// <param name="json"></param>
        /// <param name="properyName"></param>
        /// <returns></returns>
        public static IEnumerable<string> GetAllValuesForProperty(string json, string propertyName)
        {
            List<string> values = new List<string>();
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
                            values.Add(reader.Value.ToString());
                        }
                    }
                }
            }
            return values;
        }
    }
}