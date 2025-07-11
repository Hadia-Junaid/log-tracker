define(["require", "exports", "../accUtils"], function (require, exports, AccUtils) {
    "use strict";
    class AboutViewModel {
        constructor() {
        }
        connected() {
            AccUtils.announce("About page loaded.");
            document.title = "About";
        }
        disconnected() {
        }
        transitionCompleted() {
        }
    }
    return AboutViewModel;
});
//# sourceMappingURL=about.js.map