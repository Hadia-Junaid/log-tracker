/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import * as ko from "knockout";
import * as ModuleUtils from "ojs/ojmodule-element-utils";
import * as ResponsiveUtils from "ojs/ojresponsiveutils";
import * as ResponsiveKnockoutUtils from "ojs/ojresponsiveknockoututils";
import CoreRouter = require ("ojs/ojcorerouter");
import ModuleRouterAdapter = require("ojs/ojmodulerouter-adapter");
import KnockoutRouterAdapter = require("ojs/ojknockoutrouteradapter");
import UrlParamAdapter = require("ojs/ojurlparamadapter");
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojknockout";
import "ojs/ojmodule-element";
import { ojNavigationList } from "ojs/ojnavigationlist";
import { ojModule } from "ojs/ojmodule-element";
import Context = require("ojs/ojcontext");
import "ojs/ojdrawerpopup";

interface CoreRouterDetail {
  label: string;
  iconClass: string;
};

class RootViewModel {
  manner: ko.Observable<string>;
  message: ko.Observable<string|undefined>;
  smScreen: ko.Observable<boolean>|undefined;
  mdScreen: ko.Observable<boolean>|undefined;
  router: CoreRouter<CoreRouterDetail>|undefined;
  moduleAdapter: ModuleRouterAdapter<CoreRouterDetail>;
  sideDrawerOn: ko.Observable<boolean>;
  navDataProvider: ojNavigationList<string, CoreRouter.CoreRouterState<CoreRouterDetail>>["data"];
  appName: ko.Observable<string>;
  userLogin: ko.Observable<string>;
  footerLinks: Array<object>;
  selection: KnockoutRouterAdapter<CoreRouterDetail>;
  isAuthenticated: ko.Observable<boolean>;

  constructor() {
    // handle announcements sent when pages change, for Accessibility.
    this.manner = ko.observable("polite");
    this.message = ko.observable();

    // Initialize authentication state
    this.isAuthenticated = ko.observable(this.checkAuthToken());
    
    // Watch for changes in authentication state
    this.isAuthenticated.subscribe((authenticated) => {
      if (!authenticated && this.router) {
        // If user becomes unauthenticated, redirect to login
        this.router.go({ path: "login" });
      }
    });

    let globalBodyElement: HTMLElement = document.getElementById("globalBody") as HTMLElement;
    globalBodyElement.addEventListener("announce", this.announcementHandler, false);

    // media queries for responsive layouts
    let smQuery: string | null = ResponsiveUtils.getFrameworkQuery("sm-only");
    if (smQuery){
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
    }

    let mdQuery: string | null = ResponsiveUtils.getFrameworkQuery("md-up");
    if (mdQuery){
      this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);
    }

    const navData = [
      { 
        path: "", 
        redirect: this.checkAuthToken() ? "dashboard" : "login" 
      }, // Redirect based on authentication status
      { path: "login", detail: { label: "Login", iconClass: "oj-ux-ico-user" } },
      { path: "dashboard", detail: { label: "Dashboard", iconClass: "oj-ux-ico-bar-chart" } },
      { path: "incidents", detail: { label: "Logs", iconClass: "oj-ux-ico-fire" } },
      { path: "customers", detail: { label: "Applications", iconClass: "oj-ux-ico-contact-group" } },
      { path: "customers", detail: { label: "User Management", iconClass: "oj-ux-ico-contact-group" } },
      { path: "about", detail: { label: "Settings", iconClass: "oj-ux-ico-information-s" } }
    ];
    
    // router setup
    const router = new CoreRouter(navData, {
      urlAdapter: new UrlParamAdapter()
    });
    
    // Add route guard for authentication
    router.beforeStateChange.subscribe((args) => {
      const state = args.state;
      const isLoginRoute = state?.path === "login";
      const isAuthenticated = this.checkAuthToken();
      
      // If not authenticated and trying to access non-login route, redirect to login
      if (!isAuthenticated && !isLoginRoute) {
        console.log("User not authenticated, redirecting to login");
        // Prevent the navigation and redirect to login
        args.accept(Promise.reject());
        setTimeout(() => {
          router.go({ path: "login" });
        }, 0);
        return;
      }
      
      // If authenticated and trying to access login route, redirect to dashboard
      if (isAuthenticated && isLoginRoute) {
        console.log("User already authenticated, redirecting to dashboard");
        // Prevent the navigation and redirect to dashboard
        args.accept(Promise.reject());
        setTimeout(() => {
          router.go({ path: "dashboard" });
        }, 0);
        return;
      }
      
      // Otherwise, allow the navigation
      args.accept(Promise.resolve());
    });
    
    router.sync();
    this.router = router;

    this.moduleAdapter = new ModuleRouterAdapter(router);
    this.selection = new KnockoutRouterAdapter(router);

    // Setup the navDataProvider with protected routes only (excluding login and redirect route)
    // Only show navigation items if user is authenticated
    const protectedNavData = navData.slice(2); // Remove redirect and login routes
    this.navDataProvider = new ArrayDataProvider(protectedNavData, {keyAttributes: "path"});

    // drawer
    this.sideDrawerOn = ko.observable(false);

    // close drawer on medium and larger screens
    this.mdScreen?.subscribe(() => {
      this.sideDrawerOn(false);
    });

    // header
    // application Name used in Branding Area
    this.appName = ko.observable("LogTracker");
    
    // user Info used in Global Navigation area - get from token if available
    this.userLogin = ko.observable(this.getUserFromToken() || "Not logged in");
    
    // footer
    this.footerLinks = [
      {name: 'About Oracle', linkId: 'aboutOracle', linkTarget:'http://www.oracle.com/us/corporate/index.html#menu-about'},
      { name: "Contact Us", id: "contactUs", linkTarget: "http://www.oracle.com/us/corporate/contact/index.html" },
      { name: "Legal Notices", id: "legalNotices", linkTarget: "http://www.oracle.com/us/legal/index.html" },
      { name: "Terms Of Use", id: "termsOfUse", linkTarget: "http://www.oracle.com/us/legal/terms/index.html" },
      { name: "Your Privacy Rights", id: "yourPrivacyRights", linkTarget: "http://www.oracle.com/us/legal/privacy/index.html" },
    ];
    
    // Listen for authentication state changes
    window.addEventListener('authStateChanged', (event: any) => {
      const isAuth = event.detail.authenticated;
      if (isAuth) {
        this.isAuthenticated(true);
        this.userLogin(this.getUserFromToken() || "Authenticated User");
      }
    });
    
    // Check authentication status periodically (optional)
    setInterval(() => {
      const currentAuth = this.checkAuthToken();
      if (currentAuth !== this.isAuthenticated()) {
        this.isAuthenticated(currentAuth);
        if (currentAuth) {
          this.userLogin(this.getUserFromToken() || "User");
        } else {
          this.userLogin("Not logged in");
        }
      }
    }, 5000); // Check every 5 seconds
    
    // release the application bootstrap busy state
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();        
  }

  /**
   * Check if user has valid authentication token
   */
  private checkAuthToken(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return false;
    }
    
    // You can add more sophisticated token validation here
    // For now, just check if token exists
    try {
      // Basic validation - you might want to add expiration checks
      return token.length > 0;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  /**
   * Get user information from stored token
   */
  private getUserFromToken(): string | null {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }
    
    // In a real application, you would decode the JWT token to get user info
    // For now, return a placeholder. You can enhance this based on your token structure
    return "Authenticated User";
  }

  /**
   * Logout user
   */
  logout = (): void => {
    localStorage.removeItem('authToken');
    this.isAuthenticated(false);
    this.userLogin("Not logged in");
    if (this.router) {
      this.router.go({ path: "login" });
    }
  }

  /**
   * Handle menu actions (like logout)
   */
  menuItemAction = (event: any): void => {
    const value = event.detail.selectedValue;
    switch (value) {
      case "out":
        this.logout();
        break;
    }
  }

  announcementHandler = (event: any): void => {
      this.message(event.detail.message);
      this.manner(event.detail.manner);
  }

  // called by navigation drawer toggle button and after selection of nav drawer item
  toggleDrawer = (): void => {
    this.sideDrawerOn(!this.sideDrawerOn());
  }

  // a close listener so we can move focus back to the toggle button when the drawer closes
  openedChangedHandler = (event: CustomEvent): void => {
    if (event.detail.value === false) {
      const drawerToggleButtonElement = document.querySelector("#drawerToggleButton") as HTMLElement;
      drawerToggleButtonElement.focus();
    }
  };
}

export default new RootViewModel();
