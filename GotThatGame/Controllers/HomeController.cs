using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using DotNetOpenAuth.Messaging;
using DotNetOpenAuth.OpenId;
using DotNetOpenAuth.OpenId.RelyingParty;

namespace GotThatGame.Controllers
{
    /// <summary>
    /// A basic controller that just maps to views (this shouldn't have any logic in it)
    /// </summary>
    public class HomeController : Controller
    {
        #region Fields & Properties

        private const string CookieId = "SteamId";

        private static OpenIdRelyingParty openid = new OpenIdRelyingParty();

        /// <summary>
        /// Gets or sets the current user's Steam ID based on a cookie
        /// </summary>
        string CurrentUserSteamId
        {
            get
            {
                var steamId = Session["SteamId"];
                if (steamId != null)
                    return steamId.ToString();

                HttpCookie cookie = Request.Cookies.Get(CookieId);
                if (cookie == null)
                    return "";
                else
                    return cookie.Value;
            }
            set
            {
                Session[CookieId] = value;

                HttpCookie cookie = Request.Cookies.Get(CookieId);
                if (cookie != null)
                    cookie.Value = value;
                else
                {
                    cookie = new HttpCookie(CookieId, value);
                    Response.Cookies.Add(cookie);
                }
            }
        } 

        #endregion

        #region Action Methods

        /// <summary>
        /// Action for homepage
        /// </summary>
        /// <returns></returns>
        [OutputCache(CacheProfile = "Dynamic")]
        public ActionResult Index()
        {
            ViewBag.SteamId = CurrentUserSteamId;
            return View();
        }

        /// <summary>
        /// Action for site terms of service
        /// </summary>
        /// <returns></returns>
        [OutputCache(CacheProfile = "Static")]
        public ViewResult Legal()
        {
            return View();
        }

        /// <summary>
        /// Action for About page
        /// </summary>
        /// <returns></returns>
        [OutputCache(CacheProfile = "Static")]
        public ViewResult About()
        {
            return View();
        }

        /// <summary>
        /// Action for Support Page
        /// </summary>
        /// <returns></returns>
        [OutputCache(CacheProfile = "Static")]
        public ViewResult Support()
        {

            var developers = new List<string>();
            var me = developers.Where(d => d.IsNormalized() && d.IsNormalized());
            return View();
        }

        public ViewResult Compare()
        {
            ViewBag.SteamId = CurrentUserSteamId;
            return View();
        }

        #endregion

        #region OpenID Authorization via Steam

        /// <summary>
        /// Action for initiating Steam OpenID auth, plus receiving Steam's response
        /// This is kicked off by the login action on the homepage (which is the "Stage 1" identified in the DotNetOpenAuth website)
        /// This must call back to Index directly; otherwise, caching prevents unique output for each user
        /// </summary>
        /// <param name="returnUrl"></param>
        /// <returns></returns>
        [ValidateInput(false)]
        public ActionResult Authenticate(string returnUrl)
        {
            var response = openid.GetResponse();
            if (response == null)
            {
                // Stage 1: user submitting Identifier
                try
                {
                    return openid.CreateRequest("http://steamcommunity.com/openid").RedirectingResponse.AsActionResult();
                }
                catch (ProtocolException ex)
                {
                    ViewData["Message"] = ex.Message;
                    return View("Home");
                }
            }
            else
            {
                // Stage 2: OpenID Provider sending assertion response
                switch (response.Status)
                {
                    case AuthenticationStatus.Authenticated:
                        string steamId = response.FriendlyIdentifierForDisplay.Replace("steamcommunity.com/openid/id/", "");

                        CurrentUserSteamId = steamId;

                        if (!string.IsNullOrEmpty(returnUrl))
                            return Redirect(returnUrl);
                        else
                            return RedirectToAction("Compare");

                    case AuthenticationStatus.Canceled:
                        ViewBag.ErrorMessage = "Authentication Canceled by Steam; Please Try Again";
                        return View("Home");
                    case AuthenticationStatus.Failed:
                        ViewBag.ErrorMessage = response.Exception.Message;
                        return View("Home");
                }
            }
            return new EmptyResult();
        } 

        #endregion

        
    }
}
