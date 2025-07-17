define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.announce = announce;
    let validAriaLiveValues = ["off", "polite", "assertive"];
    function announce(message, manner) {
        if (manner === undefined || validAriaLiveValues.indexOf(manner) === -1) {
            manner = "polite";
        }
        let params = {
            "bubbles": true,
            "detail": { "message": message, "manner": manner }
        };
        let globalBodyElement = document.getElementById("globalBody");
        globalBodyElement.dispatchEvent(new CustomEvent("announce", params));
    }
});
//# sourceMappingURL=accUtils.js.map