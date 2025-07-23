define(["require", "exports", "knockout", "ojs/ojbootstrap", "./appController", "ojs/ojknockout", "ojs/ojmodule", "ojs/ojnavigationlist", "ojs/ojbutton", "ojs/ojtoolbar"], function (require, exports, ko, ojbootstrap_1, appController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function init() {
        ko.applyBindings(appController_1.default, document.getElementById("globalBody"));
    }
    (0, ojbootstrap_1.whenDocumentReady)().then(function () {
        if (document.body.classList.contains("oj-hybrid")) {
            document.addEventListener("deviceready", init);
        }
        else {
            init();
        }
    });
});
//# sourceMappingURL=root.js.map