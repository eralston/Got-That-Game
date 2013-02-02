using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.VisualStudio.TestTools.UnitTesting;

using GotThatGame.Models;

namespace GotThatGame.Test
{
    [TestClass]
    public class SteamModelTest
    {
        [TestMethod]
        public void PlayerInit()
        {
            Player player = Player.GetPlayerByFriendlyName("eralston", true);

            Assert.IsNotNull(player);
        }

        [TestMethod]
        public void GameTest()
        {
            var list = Game.GetGamesForPlayer("eralston");

            Assert.IsNotNull(list);
        }
    }
}
