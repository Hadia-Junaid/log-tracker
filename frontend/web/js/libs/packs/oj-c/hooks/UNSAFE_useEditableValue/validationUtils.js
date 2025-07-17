define(["require", "exports", "./utils"], function (require, exports, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateAsync = validateAsync;
    exports.validateSync = validateSync;
    function validateSync({ validators, value }) {
        const errors = [];
        for (const validator of validators) {
            try {
                validator.validate(value);
            }
            catch (error) {
                errors.push((0, utils_1.createMessageFromError)(error));
            }
        }
        if (errors.length) {
            return { result: 'failure', errors };
        }
        return { result: 'success' };
    }
    function validateAsync({ validators, value }) {
        const doValidate = (validator, value) => {
            try {
                const validateResult = validator.validate(value);
                if (validateResult instanceof Promise) {
                    return validateResult.then(() => { }, (error) => {
                        return {
                            message: (0, utils_1.createMessageFromError)(error),
                            messageDisplayStrategy: error?.messageDisplayStrategy
                        };
                    });
                }
            }
            catch (error) {
                return {
                    message: (0, utils_1.createMessageFromError)(error),
                    messageDisplayStrategy: error?.messageDisplayStrategy
                };
            }
            return;
        };
        const errors = [];
        const maybeErrorPromises = [];
        for (const validator of validators) {
            const maybeValidatorErrorResult = doValidate(validator, value);
            if (maybeValidatorErrorResult !== undefined) {
                if (maybeValidatorErrorResult instanceof Promise) {
                    maybeErrorPromises.push(maybeValidatorErrorResult);
                }
                else {
                    errors.push(maybeValidatorErrorResult);
                }
            }
        }
        return {
            errors,
            maybeErrorPromises
        };
    }
});
