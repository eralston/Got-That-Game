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
    class SteamModelTest
    {
        [TestMethod]
        public void PlayerInit()
        {
            Player player = Player.GetPlayerByFriendlyName("eralston");
        }
    }
}
