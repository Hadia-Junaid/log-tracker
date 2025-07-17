define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class GlobalDialog {
        open(dialogId) {
            const dialog = document.getElementById(dialogId);
            if (dialog && typeof dialog.open === 'function') {
                dialog.open();
            }
            else {
                console.warn(`Dialog with ID '${dialogId}' not found or cannot be opened.`);
            }
        }
        close(dialogId) {
            const dialog = document.getElementById(dialogId);
            if (dialog && typeof dialog.close === 'function') {
                dialog.close();
            }
            else {
                console.warn(`Dialog with ID '${dialogId}' not found or cannot be closed.`);
            }
        }
    }
    exports.default = new GlobalDialog();
});
//# sourceMappingURL=globalDialog.js.map