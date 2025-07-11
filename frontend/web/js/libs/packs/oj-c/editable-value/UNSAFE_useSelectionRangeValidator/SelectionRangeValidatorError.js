define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionRangeValidatorError = void 0;
    class SelectionRangeValidatorError extends Error {
        constructor(message) {
            super(message);
            this.name = 'SelectionRangeValidatorError';
            this.messageDisplayStrategy = 'displayOnBlur';
        }
    }
    exports.SelectionRangeValidatorError = SelectionRangeValidatorError;
});
