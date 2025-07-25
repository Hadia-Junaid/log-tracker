define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRelativeTime = getRelativeTime;
    function getRelativeTime(date) {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1
        };
        for (const [unit, val] of Object.entries(intervals)) {
            const count = Math.floor(seconds / val);
            if (count > 0)
                return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
        }
        return 'just now';
    }
});
//# sourceMappingURL=userManagementUtils.js.map