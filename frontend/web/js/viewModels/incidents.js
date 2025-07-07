define(["require", "exports", "../accUtils"], function (require, exports, AccUtils) {
    "use strict";
    class IncidentsViewModel {
        constructor() {
        }
        connected() {
            AccUtils.announce("Incidents page loaded.");
            document.title = "Incidents";
        }
        disconnected() {
        }
        transitionCompleted() {
        }
    }
    return IncidentsViewModel;
});
//# sourceMappingURL=incidents.js.map