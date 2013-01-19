using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using GotThatGame.Controllers;

namespace GotThatGame.Test
{
	[TestClass]
    public class HomeControllerTest
    {
        [TestMethod]
        public void IndexTest()
        {
        	// Arrange
        	var controller = new HomeController();
        
        	// Act
        	var actionResult = controller.Index();
        
        	// Assert
        	Assert.Inconclusive(); // Todo: Make assertions, then remove this line
        }

        [TestMethod]
        public void LegalTest()
        {
        	// Arrange
        	var controller = new HomeController();
        
        	// Act
        	var viewResult = controller.Legal();
        	var viewModel = viewResult.Model;
        
        	// Assert
        	// Assert.AreEqual("expected value", viewModel.SomeProperty);
        	Assert.Inconclusive(); // Todo: Make assertions, then remove this line
        }

        [TestMethod]
        public void AboutTest()
        {
        	// Arrange
        	var controller = new HomeController();
        
        	// Act
        	var viewResult = controller.About();
        	var viewModel = viewResult.Model;
        
        	// Assert
        	// Assert.AreEqual("expected value", viewModel.SomeProperty);
        	Assert.Inconclusive(); // Todo: Make assertions, then remove this line
        }

        [TestMethod]
        public void SupportTest()
        {
        	// Arrange
        	var controller = new HomeController();
        
        	// Act
        	var viewResult = controller.Support();
        	var viewModel = viewResult.Model;
        
        	// Assert
        	// Assert.AreEqual("expected value", viewModel.SomeProperty);
        	Assert.Inconclusive(); // Todo: Make assertions, then remove this line
        }
    }
}