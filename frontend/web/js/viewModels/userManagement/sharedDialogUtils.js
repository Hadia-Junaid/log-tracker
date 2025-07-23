var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "../../services/config-service", "../../services/logger-service"], function (require, exports, config_service_1, logger_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resetSearchState = exports.clearSearchTimeout = exports.createSearchInputHandler = exports.performUserSearch = exports.getInitials = exports.DEBOUNCE_DELAY = void 0;
    exports.DEBOUNCE_DELAY = 300;
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .slice(0, 2);
    };
    exports.getInitials = getInitials;
    const performUserSearch = (searchString, config) => __awaiter(void 0, void 0, void 0, function* () {
        logger_service_1.default.debug(`User search initiated ${config.logContext}`, { searchString });
        if (!searchString || searchString.trim().length === 0) {
            config.availableMembersObservable([]);
            return;
        }
        try {
            const apiUrl = config_service_1.ConfigService.getApiUrl();
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                throw new Error('No authentication token found');
            }
            const response = yield fetch(`${apiUrl}/admin/users/search?searchString=${encodeURIComponent(searchString)}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const users = yield response.json();
            const excludedMemberEmails = config.excludedMembersObservable().map(member => member.email);
            const availableUsers = users
                .filter((user) => !excludedMemberEmails.includes(user.email))
                .map((user, index) => ({
                id: index + 1,
                email: user.email,
                name: user.name || user.email,
                initials: (0, exports.getInitials)(user.name || user.email)
            }));
            config.availableMembersObservable(availableUsers);
            logger_service_1.default.info(`User search completed successfully ${config.logContext}`, {
                searchString,
                foundUsers: availableUsers.length
            });
        }
        catch (error) {
            logger_service_1.default.error(`Failed to search users from backend API ${config.logContext}`, {
                searchString,
                error: error instanceof Error ? error.message : String(error)
            });
            config.availableMembersObservable([]);
            config.errorObservable('Failed to search for users. Please try again.');
        }
    });
    exports.performUserSearch = performUserSearch;
    const createSearchInputHandler = (searchConfig, timeoutRef) => {
        return (event) => {
            const searchString = event.detail.value;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                (0, exports.performUserSearch)(searchString, searchConfig);
            }, exports.DEBOUNCE_DELAY);
        };
    };
    exports.createSearchInputHandler = createSearchInputHandler;
    const clearSearchTimeout = (timeoutRef) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
    };
    exports.clearSearchTimeout = clearSearchTimeout;
    const resetSearchState = (searchValue, searchRawValue, availableMembers, errorObservable) => {
        searchValue("");
        searchRawValue("");
        availableMembers([]);
        errorObservable("");
    };
    exports.resetSearchState = resetSearchState;
});
//# sourceMappingURL=sharedDialogUtils.js.map