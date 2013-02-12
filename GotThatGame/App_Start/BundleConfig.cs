using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;

namespace GotThatGame
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/Scripts/steam").Include(
                        "~/Scripts/jquery.tinysort*",
                        "~/Scripts/Steam*"));

            bundles.Add(new StyleBundle("~/Content/site").Include(
                        "~/Content/site.css"));

            bundles.Add(new StyleBundle("~/Content/steam").Include(
                        "~/Content/site.css",
                        "~/Content/steam.css",
                        "~/Content/Fonts/fontawesome.css"));
        }
    }
}