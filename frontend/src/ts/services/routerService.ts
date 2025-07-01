// src/ts/services/routerService.ts
import CoreRouter = require("ojs/ojcorerouter");
import UrlParamAdapter = require("ojs/ojurlparamadapter");
import { authService } from "./authService";

const navData = [
  { path: "", redirect: "dashboard" },
  { path: "login", detail: { label: "Login", iconClass: "oj-ux-ico-user" } },
  { path: "dashboard", detail: { label: "Dashboard", iconClass: "oj-ux-ico-bar-chart" } },
  { path: "incidents", detail: { label: "Logs", iconClass: "oj-ux-ico-fire" } },
  // ... other routes
];

const createRouter = () => {
  const router = new CoreRouter(navData, {
    urlAdapter: new UrlParamAdapter()
  });

  router.beforeStateChange.subscribe(async (args) => {
    const { state } = args;
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated && state?.path !== "login") {
      args.accept(Promise.resolve().then(() => router.go({ path: "login" })));
      return;
    }

    if (isAuthenticated && state?.path === "login") {
      args.accept(Promise.resolve().then(() => router.go({ path: "dashboard" })));
      return;
    }

    args.accept(Promise.resolve());
  });

  return router;
};

export const router = createRouter();

// Filter out the 'login' route for the nav list
export const protectedNavData = navData.filter(item => item.path && item.path !== 'login');