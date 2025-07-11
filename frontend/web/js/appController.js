var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "knockout", "ojs/ojresponsiveutils", "ojs/ojresponsiveknockoututils", "ojs/ojmodulerouter-adapter", "ojs/ojknockoutrouteradapter", "ojs/ojarraydataprovider", "ojs/ojcontext", "./data/navigation.data", "./data/footer.data", "./services/auth.service", "./router.config", "ojs/ojknockout", "ojs/ojmodule-element", "ojs/ojdrawerpopup"], function (require, exports, ko, ResponsiveUtils, ResponsiveKnockoutUtils, ModuleRouterAdapter, KnockoutRouterAdapter, ArrayDataProvider, Context, navigation_data_1, footer_data_1, auth_service_1, router_config_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RootViewModel {
        updateNavDataProvider() {
            let filteredNavData = navigation_data_1.navData.slice(2);
            if (!this.authService.getIsAdminFromToken()) {
                filteredNavData = filteredNavData.filter((item) => item.path !== "userManagement");
            }
            this.navDataProvider(new ArrayDataProvider(filteredNavData, { keyAttributes: "path" }));
        }
        constructor() {
            this.menuItemAction = (event) => __awaiter(this, void 0, void 0, function* () {
                if (event.detail.selectedValue === "out") {
                    if (this.isLoggingOut())
                        return;
                    this.isLoggingOut(true);
                    try {
                        yield this.authService.logout();
                        this.isAuthenticated(false);
                        this.updateUserInfo();
                        setTimeout(() => this.router.go({ path: "login" }), 0);
                    }
                    catch (error) {
                        console.error("Logout error:", error);
                    }
                    finally {
                        this.isLoggingOut(false);
                    }
                }
            });
            this.announcementHandler = (event) => {
                this.message(event.detail.message);
                this.manner(event.detail.manner);
            };
            this.toggleDrawer = () => {
                this.sideDrawerOn(!this.sideDrawerOn());
            };
            this.openedChangedHandler = (event) => {
                if (event.detail.value === false) {
                    const drawerToggleButtonElement = document.querySelector("#drawerToggleButton");
                    drawerToggleButtonElement === null || drawerToggleButtonElement === void 0 ? void 0 : drawerToggleButtonElement.focus();
                }
            };
            this.manner = ko.observable("polite");
            this.message = ko.observable();
            this.isLoggingOut = ko.observable(false);
            this.authService = new auth_service_1.AuthService();
            this.isAuthenticated = ko.observable(this.authService.checkAuthToken());
            this.router = (0, router_config_1.createRouter)();
            this.router.sync();
            this.moduleAdapter = new ModuleRouterAdapter(this.router);
            this.selection = new KnockoutRouterAdapter(this.router);
            const smQuery = ResponsiveUtils.getFrameworkQuery("sm-only");
            if (smQuery) {
                this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
            }
            const mdQuery = ResponsiveUtils.getFrameworkQuery("md-up");
            if (mdQuery) {
                this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);
                this.mdScreen.subscribe(() => this.sideDrawerOn(false));
            }
            this.navDataProvider = ko.observable(new ArrayDataProvider([], { keyAttributes: "path" }));
            this.updateNavDataProvider();
            this.sideDrawerOn = ko.observable(false);
            this.appName = ko.observable("LogTracker");
            this.footerLinks = footer_data_1.footerLinks;
            this.userLogin = ko.observable("Not logged in");
            this.userEmail = ko.observable("");
            this.userInitials = ko.observable("U");
            this.updateUserInfo();
            this.setupEventListeners();
            Context.getPageContext().getBusyContext().applicationBootstrapComplete();
        }
        setupEventListeners() {
            const globalBody = document.getElementById("globalBody");
            if (globalBody) {
                globalBody.addEventListener("announce", this.announcementHandler, false);
            }
            window.addEventListener("authStateChanged", (event) => {
                this.isAuthenticated(event.detail.authenticated);
                this.updateUserInfo();
                this.updateNavDataProvider();
                if (!event.detail.authenticated) {
                    this.router.go({ path: "login" });
                }
            });
        }
        updateUserInfo() {
            const userInfo = this.authService.getUserInfoFromToken();
            if (userInfo && this.isAuthenticated()) {
                this.userLogin(userInfo.name);
                this.userEmail(userInfo.email);
                this.userInitials(this.authService.getUserInitials());
            }
            else {
                this.userLogin("Not logged in");
                this.userEmail("");
                this.userInitials("U");
            }
        }
    }
    exports.default = new RootViewModel();
});
//# sourceMappingURL=appController.js.map