// src/ts/viewModels/appController.ts
import * as ko from "knockout";
import Context = require("ojs/ojcontext");
import * as ResponsiveUtils from "ojs/ojresponsiveutils";
import * as ResponsiveKnockoutUtils from "ojs/ojresponsiveknockoututils";
import ModuleRouterAdapter = require("ojs/ojmodulerouter-adapter");
import KnockoutRouterAdapter = require("ojs/ojknockoutrouteradapter");
import ArrayDataProvider = require("ojs/ojarraydataprovider");

// Import your new services
import { authService } from "./services/authService";
import { userState } from "./services/userState";
import { router, protectedNavData } from "./services/routerService";

import "ojs/ojknockout";
import "ojs/ojmodule-element";
import "ojs/ojdrawerpopup";
import "ojs/ojnavigationlist";

class RootViewModel {
  public appName: ko.Observable<string> = ko.observable("LogTracker");
  public readonly footerLinks: object[];

  // UI Observables
  public manner: ko.Observable<string> = ko.observable("polite");
  public message: ko.Observable<string | undefined> = ko.observable();
  public sideDrawerOn: ko.Observable<boolean> = ko.observable(false);

  // Router and Adapters
  public router = router;
  public moduleAdapter: ModuleRouterAdapter<any>;
  public selection: KnockoutRouterAdapter<any>;
  public navDataProvider: ArrayDataProvider<string, any>;

  // Imported State
  public auth = authService;
  public user = userState;

  constructor() {
    this.moduleAdapter = new ModuleRouterAdapter(this.router);
    this.selection = new KnockoutRouterAdapter(this.router);
    this.navDataProvider = new ArrayDataProvider(protectedNavData, { keyAttributes: "path" });

    this.footerLinks = [
      { name: 'About Oracle', linkTarget: 'http://www.oracle.com/us/corporate/index.html#menu-about' },
      { name: "Contact Us", linkTarget: "http://www.oracle.com/us/corporate/contact/index.html" },
    ];
    
    // Setup responsive listeners
    const smQuery = ResponsiveUtils.getFrameworkQuery("sm-only");
    if (smQuery) {
      ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery).subscribe(() => this.sideDrawerOn(false));
    }
    
    // Sync router and release bootstrap
    this.router.sync();
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();
  }

  public toggleDrawer = (): void => {
    this.sideDrawerOn(!this.sideDrawerOn());
  }

  public menuItemAction = (event: any): void => {
    if (event.detail.selectedValue === "out") {
      this.auth.logout(this.router);
    }
  }
}

export default new RootViewModel();