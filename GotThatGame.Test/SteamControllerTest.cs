using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

using Microsoft.VisualStudio.TestTools.UnitTesting;


using GotThatGame.Controllers;

namespace GotThatGame.Test
{
	[TestClass]
    public class SteamControllerTest
    {
        [TestMethod]
        public void CurrentPlayerTest()
        {
            SteamController controller = new SteamController();

            JsonResult result = controller.CurrentUserPlayer("eralston");

            Assert.IsNotNull(result.Data);
        }

        [TestMethod]
        public void GamesTest()
        {
            SteamController controller = new SteamController();

            var player = GotThatGame.Models.Player.GetPlayerByFriendlyName("eralston");

            JsonResult result = controller.GamesBySteamId(player.SteamId);

            Assert.IsNotNull(result.Data);
        }
    }
}