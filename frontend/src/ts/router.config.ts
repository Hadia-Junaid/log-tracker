// router.config.ts

import CoreRouter = require("ojs/ojcorerouter");
import UrlParamAdapter = require("ojs/ojurlparamadapter");
import { navData } from "./data/navigation.data";
import { AuthService } from "./services/auth.service";
import { CoreRouterDetail } from "./app.types";

export function createRouter(): CoreRouter<CoreRouterDetail> {
  const authService = new AuthService();

  // Set the initial redirect based on auth status
  const initialRedirect = authService.checkAuthToken() ? "dashboard" : "login";
  const rootNavItem = navData.find((item) => item.path === "");
  if (rootNavItem) {
    rootNavItem.redirect = initialRedirect;
  }

  const router = new CoreRouter<CoreRouterDetail>(navData, {
    urlAdapter: new UrlParamAdapter(),
  });

  // Add a route guard to protect routes
  router.beforeStateChange.subscribe(async (args) => {
    const { state } = args;
    const isLoginRoute = state?.path === "login";
    const isAuthenticated = authService.checkAuthToken();

    if (!isAuthenticated && !isLoginRoute) {
      // Redirect unauthenticated users to the login page
      args.accept(Promise.resolve());
      setTimeout(() => router.go({ path: "login" }), 0);
    } else if (isAuthenticated && isLoginRoute) {
      // Redirect authenticated users away from the login page
      args.accept(Promise.resolve());
      setTimeout(() => router.go({ path: "dashboard" }), 0);
    } else {
      // Allow navigation
      args.accept(Promise.resolve());
    }
  });

  return router;
}