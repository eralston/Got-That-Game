[assembly: WebActivator.PreApplicationStartMethod(typeof(GotThatGame.App_Start.Combres), "PreStart")]
namespace GotThatGame.App_Start {
	using System.Web.Routing;
	using global::Combres;
	
    public static class Combres {
        public static void PreStart() {
            RouteTable.Routes.AddCombresRoute("Combres");
        }
    }
}