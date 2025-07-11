define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.navData = void 0;
    exports.navData = [
        {
            path: "",
            redirect: "dashboard",
        },
        {
            path: "login",
            detail: { label: "Login", iconClass: "oj-ux-ico-user" },
        },
        {
            path: "dashboard",
            detail: { label: "Dashboard", iconClass: "oj-ux-ico-bar-chart" },
        },
        {
            path: "incidents",
            detail: { label: "Logs", iconClass: "oj-ux-ico-fire" },
        },
        {
            path: "applications",
            detail: { label: "Applications", iconClass: "oj-ux-ico-contact-group" },
        },
        {
            path: "userManagement",
            detail: {
                label: "User Management",
                iconClass: "oj-ux-ico-contact-group",
            },
        },
        {
            path: "about",
            detail: { label: "Settings", iconClass: "oj-ux-ico-information-s" },
        },
    ];
});
//# sourceMappingURL=navigation.data.js.map