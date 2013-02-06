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
        public void CurrentPlayerByFriendlyNameTest()
        {
            SteamController controller = new SteamController();

            JsonResult result = controller.CurrentUserPlayerByFriendlyName("eralston");

            Assert.IsNotNull(result.Data);
        }

        [TestMethod]
        public void CurrentPlayerBySteamIdTest()
        {
            SteamController controller = new SteamController();

            var player = GotThatGame.Models.Player.GetPlayerByFriendlyName("eralston");

            JsonResult result = controller.CurrentUserPlayerBySteamId(player.SteamId);

            Assert.IsNotNull(result.Data);
        }

        [TestMethod]
        public void GamesBySteamIdTest()
        {
            SteamController controller = new SteamController();

            var player = GotThatGame.Models.Player.GetPlayerByFriendlyName("eralston");

            JsonResult result = controller.GamesBySteamId(player.SteamId);

            Assert.IsNotNull(result.Data);
        }
    }
}