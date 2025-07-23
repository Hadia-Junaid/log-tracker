var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "ojs/ojcorerouter", "ojs/ojurlparamadapter", "./data/navigation.data", "./services/auth.service"], function (require, exports, CoreRouter, UrlParamAdapter, navigation_data_1, auth_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createRouter = createRouter;
    function createRouter() {
        const authService = new auth_service_1.AuthService();
        const initialRedirect = authService.checkAuthToken() ? "dashboard" : "login";
        const rootNavItem = navigation_data_1.navData.find((item) => item.path === "");
        if (rootNavItem) {
            rootNavItem.redirect = initialRedirect;
        }
        const router = new CoreRouter(navigation_data_1.navData, {
            urlAdapter: new UrlParamAdapter(),
        });
        router.beforeStateChange.subscribe((args) => __awaiter(this, void 0, void 0, function* () {
            const { state } = args;
            const isLoginRoute = (state === null || state === void 0 ? void 0 : state.path) === "login";
            const isAuthenticated = authService.checkAuthToken();
            const isUserManagementRoute = (state === null || state === void 0 ? void 0 : state.path) === "userManagement";
            const isAdmin = authService.getIsAdminFromToken();
            if (!isAuthenticated && !isLoginRoute) {
                args.accept(Promise.resolve());
                setTimeout(() => router.go({ path: "login" }), 0);
            }
            else if (isUserManagementRoute && !isAdmin) {
                args.accept(Promise.resolve());
                setTimeout(() => router.go({ path: "dashboard" }), 0);
            }
            else if (isAuthenticated && isLoginRoute) {
                args.accept(Promise.resolve());
                setTimeout(() => router.go({ path: "dashboard" }), 0);
            }
            else {
                args.accept(Promise.resolve());
            }
        }));
        return router;
    }
});
//# sourceMappingURL=router.config.js.map