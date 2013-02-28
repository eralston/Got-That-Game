using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace GotThatGame.Controllers
{
    /// <summary>
    /// A basic controller that just maps to views (this shouldn't have any logic in it)
    /// </summary>
    public class HomeController : Controller
    {
        [OutputCache(CacheProfile = "Dynamic")]
        public ActionResult Index()
        {
            return View();
        }

        [OutputCache(CacheProfile = "Static")]
        public ViewResult Legal()
        {
        	return View();
        }

        [OutputCache(CacheProfile = "Static")]
        public ViewResult About()
        {
        	return View();
        }

        [OutputCache(CacheProfile = "Static")]
        public ViewResult Support()
        {
        	return View();
        }
    }
}
