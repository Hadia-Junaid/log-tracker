define(["require", "exports", "../accUtils"], function (require, exports, AccUtils) {
    "use strict";
    class DashboardViewModel {
        constructor() {
        }
        connected() {
            AccUtils.announce("Dashboard page loaded.");
            document.title = "Dashboard";
        }
        disconnected() {
        }
        transitionCompleted() {
        }
    }
    return DashboardViewModel;
});
//# sourceMappingURL=dashboard.js.map