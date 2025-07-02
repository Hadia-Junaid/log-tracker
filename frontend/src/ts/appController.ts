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
import CoreRouter = require("ojs/ojcorerouter");
import ModuleRouterAdapter = require("ojs/ojmodulerouter-adapter");
import KnockoutRouterAdapter = require("ojs/ojknockoutrouteradapter");
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import Context = require("ojs/ojcontext");
import "ojs/ojknockout";
import "ojs/ojmodule-element";
import { ojNavigationList } from "ojs/ojnavigationlist";
import "ojs/ojdrawerpopup";

import { CoreRouterDetail } from "./app.types";
import { navData } from "./data/navigation.data";
import { footerLinks } from "./data/footer.data";
import { AuthService } from "./services/auth.service";
import { createRouter } from "./router.config";

class RootViewModel {
  manner: ko.Observable<string>;
  message: ko.Observable<string | undefined>;
  smScreen: ko.Observable<boolean> | undefined;
  mdScreen: ko.Observable<boolean> | undefined;

  router: CoreRouter<CoreRouterDetail>;
  moduleAdapter: ModuleRouterAdapter<CoreRouterDetail>;
  selection: KnockoutRouterAdapter<CoreRouterDetail>;

  navDataProvider: ojNavigationList<
    string,
    CoreRouter.CoreRouterState<CoreRouterDetail>
  >["data"] | undefined;

  sideDrawerOn: ko.Observable<boolean>;
  appName: ko.Observable<string>;
  userLogin: ko.Observable<string>;
  userEmail: ko.Observable<string>;
  userInitials: ko.Observable<string>;
  footerLinks: Array<object>;
  isAuthenticated: ko.Observable<boolean>;
  isLoggingOut: ko.Observable<boolean>;

  private authService: AuthService;

  private updateNavDataProvider(): void {
    let filteredNavData = navData.slice(2);
    if (!this.authService.getIsAdminFromToken()) {
      filteredNavData = filteredNavData.filter(
        (item) => item.path !== "userManagement"
      );
    }
    this.navDataProvider = new ArrayDataProvider(filteredNavData, {
      keyAttributes: "path",
    });
  }

  constructor() {
    this.manner = ko.observable("polite");
    this.message = ko.observable();
    this.isLoggingOut = ko.observable(false);

    this.authService = new AuthService();
    this.isAuthenticated = ko.observable(this.authService.checkAuthToken());

    this.router = createRouter();
    this.router.sync();

    this.moduleAdapter = new ModuleRouterAdapter(this.router);
    this.selection = new KnockoutRouterAdapter(this.router);

    // Responsive observables
    const smQuery = ResponsiveUtils.getFrameworkQuery("sm-only");
    if (smQuery) {
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
    }
    const mdQuery = ResponsiveUtils.getFrameworkQuery("md-up");
    if (mdQuery) {
      this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);
      this.mdScreen.subscribe(() => this.sideDrawerOn(false));
    }

    this.updateNavDataProvider();

    this.sideDrawerOn = ko.observable(false);

    // Header and user info
    this.appName = ko.observable("LogTracker");
    this.footerLinks = footerLinks;
    this.userLogin = ko.observable("Not logged in");
    this.userEmail = ko.observable("");
    this.userInitials = ko.observable("U");
    this.updateUserInfo(); 

    this.setupEventListeners();

    // Release bootstrap busy state
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();
  }

  private setupEventListeners(): void {
    // Listener for page announcements
    const globalBody = document.getElementById("globalBody");
    if (globalBody) {
      globalBody.addEventListener("announce", this.announcementHandler, false);
    }

    // Listener for authentication state changes from other parts of the app
    window.addEventListener("authStateChanged", (event: any) => {
      this.isAuthenticated(event.detail.authenticated);
      this.updateUserInfo();
      this.updateNavDataProvider();
      if (!event.detail.authenticated) {
        this.router.go({ path: "login" });
      }
    });

  }

  private updateUserInfo(): void {
    const userInfo = this.authService.getUserInfoFromToken();
    if (userInfo && this.isAuthenticated()) {
      this.userLogin(userInfo.name);
      this.userEmail(userInfo.email);
      this.userInitials(this.authService.getUserInitials());
    } else {
      this.userLogin("Not logged in");
      this.userEmail("");
      this.userInitials("U");
    }
  }

  menuItemAction = async (event: any): Promise<void> => {
    if (event.detail.selectedValue === "out") {
      if (this.isLoggingOut()) return;

      this.isLoggingOut(true);
      try {
        await this.authService.logout();
        this.isAuthenticated(false);
        this.updateUserInfo();
        setTimeout(() => this.router.go({ path: "login" }), 0);
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        this.isLoggingOut(false);
      }
    }
  };

  announcementHandler = (event: any): void => {
    this.message(event.detail.message);
    this.manner(event.detail.manner);
  };

  toggleDrawer = (): void => {
    this.sideDrawerOn(!this.sideDrawerOn());
  };

  openedChangedHandler = (event: CustomEvent): void => {
    if (event.detail.value === false) {
      const drawerToggleButtonElement = document.querySelector(
        "#drawerToggleButton"
      ) as HTMLElement;
      drawerToggleButtonElement?.focus();
    }
  };
}

export default new RootViewModel();
