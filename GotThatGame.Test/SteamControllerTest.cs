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
        public void CurrentUserPlayerByFriendlyNameTest()
        {
            // Arrange
            var controller = new SteamController();

            // Act
            var result = controller.CurrentUserPlayerByFriendlyName("eralston");

            // Assert
            Assert.IsNotNull(result); // Todo: Make assertions, then remove this line
        }

        [TestMethod]
        public void PlayerByFriendlyNameTest()
        {
            // Arrange
            var controller = new SteamController();

            // Act
            var result = controller.PlayerByFriendlyName("eralston");

            // Assert
            Assert.IsNotNull(result); // Todo: Make assertions, then remove this line
        }

        [TestMethod]
        public void PlayerBySteamIdTest()
        {
            // Arrange
            var controller = new SteamController();

            // Act
            var result = controller.PlayerBySteamId(GotThatGame.Models.Player.GetSteamIdByFriendlyName("eralston"));

            // Assert
            Assert.IsNotNull(result); // Todo: Make assertions, then remove this line
        }

        [TestMethod]
        public void FriendsBySteamIdTest()
        {
            // Arrange
            var controller = new SteamController();

            // Act
            var result = controller.FriendsBySteamId(GotThatGame.Models.Player.GetSteamIdByFriendlyName("eralston"));

            // Assert
            Assert.IsNotNull(result); // Todo: Make assertions, then remove this line
        }

        [TestMethod]
        public void GamesBySteamIdTest()
        {
            // Arrange
            var controller = new SteamController();

            // Act
            var result = controller.GamesBySteamId(GotThatGame.Models.Player.GetSteamIdByFriendlyName("eralston"));

            // Assert
            Assert.IsNotNull(result); // Todo: Make assertions, then remove this line
        }
    }
}