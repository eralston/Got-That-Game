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

        public ActionResult Index()
        {
            return View();
        }

        public ViewResult Legal()
        {
        	return View();
        }

        public ViewResult About()
        {
        	return View();
        }

        public ViewResult Support()
        {
        	return View();
        }

    }
}
