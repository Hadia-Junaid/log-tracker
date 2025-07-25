import * as ko from "knockout";
import CoreRouter = require("ojs/ojcorerouter");
import ModuleRouterAdapter = require("ojs/ojmodulerouter-adapter");
import KnockoutRouterAdapter = require("ojs/ojknockoutrouteradapter");
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojknockout";
import "ojs/ojmodule-element";
import "ojs/ojdrawerpopup";
import { CoreRouterDetail } from "./app.types";
declare class RootViewModel {
    manner: ko.Observable<string>;
    message: ko.Observable<string | undefined>;
    smScreen: ko.Observable<boolean> | undefined;
    mdScreen: ko.Observable<boolean> | undefined;
    router: CoreRouter<CoreRouterDetail>;
    moduleAdapter: ModuleRouterAdapter<CoreRouterDetail>;
    selection: KnockoutRouterAdapter<CoreRouterDetail>;
    navDataProvider: ko.Observable<ArrayDataProvider<any, any>>;
    sideDrawerOn: ko.Observable<boolean>;
    appName: ko.Observable<string>;
    userLogin: ko.Observable<string>;
    userEmail: ko.Observable<string>;
    userInitials: ko.Observable<string>;
    footerLinks: Array<object>;
    isAuthenticated: ko.Observable<boolean>;
    isLoggingOut: ko.Observable<boolean>;
    private authService;
    private updateNavDataProvider;
    constructor();
    private setupEventListeners;
    private updateUserInfo;
    menuItemAction: (event: any) => Promise<void>;
    announcementHandler: (event: any) => void;
    toggleDrawer: () => void;
    openedChangedHandler: (event: CustomEvent) => void;
}
declare const _default: RootViewModel;
export default _default;
