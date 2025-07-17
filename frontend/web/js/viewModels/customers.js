define(["require", "exports", "../accUtils"], function (require, exports, AccUtils) {
    "use strict";
    class CustomersViewModel {
        constructor() {
        }
        connected() {
            AccUtils.announce("Customers page loaded.");
            document.title = "Customers";
        }
        disconnected() {
        }
        transitionCompleted() {
        }
    }
    return CustomersViewModel;
});
//# sourceMappingURL=customers.js.map