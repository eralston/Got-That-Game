using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace GotThatGame
{
    /// <summary>
    /// Class for holding extensions for the HtmlHelper function
    /// </summary>
    public static class HtmlHelperExtensions
    {
        /// <summary>
        /// Returns true if the build is DEBUG; otherwise, returns false
        /// </summary>
        /// <param name="htmlHelper"></param>
        /// <returns></returns>
        public static bool IsDebug(this HtmlHelper htmlHelper)
        {
#if DEBUG
            return true;
#else
      return false;
#endif
        }
    }
}