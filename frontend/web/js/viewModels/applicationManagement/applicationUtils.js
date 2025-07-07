define(["require", "exports", "ojs/ojarraydataprovider"], function (require, exports, ArrayDataProvider) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.environmentFilterOptions = exports.statusFilterOptions = exports.sortOptions = exports.envOptions = void 0;
    exports.getRelativeTime = getRelativeTime;
    exports.envOptions = new ArrayDataProvider([
        { value: 'Development', label: 'Development' },
        { value: 'Testing', label: 'Testing' },
        { value: 'Production', label: 'Production' },
        { value: 'Staging', label: 'Staging' }
    ], { keyAttributes: 'value' });
    exports.sortOptions = new ArrayDataProvider([
        { value: 'nameAsc', label: 'Name (A-Z)' },
        { value: 'nameDesc', label: 'Name (Z-A)' },
        { value: 'createdAtAsc', label: 'Created At (Oldest First)' },
        { value: 'createdAtDesc', label: 'Created At (Newest First)' },
        { value: 'updatedAtAsc', label: 'Updated At (Oldest First)' },
        { value: 'updatedAtDesc', label: 'Updated At (Newest First)' }
    ], { keyAttributes: 'value' });
    exports.statusFilterOptions = new ArrayDataProvider([
        { value: 'all', label: 'All Applications' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ], { keyAttributes: 'value' });
    exports.environmentFilterOptions = new ArrayDataProvider([
        { value: 'all', label: 'All Environments' },
        { value: 'Development', label: 'Development' },
        { value: 'Testing', label: 'Testing' },
        { value: 'Production', label: 'Production' },
        { value: 'Staging', label: 'Staging' }
    ], { keyAttributes: 'value' });
    function getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMilliseconds = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
        if (diffInDays < 1) {
            return 'Created today';
        }
        else if (diffInDays === 1) {
            return 'Created yesterday';
        }
        else if (diffInDays < 7) {
            return `Created ${diffInDays} days ago`;
        }
        else {
            const diffInWeeks = Math.floor(diffInDays / 7);
            if (diffInWeeks === 1) {
                return 'Created 1 week ago';
            }
            else {
                return `Created ${diffInWeeks} weeks ago`;
            }
        }
    }
});
//# sourceMappingURL=applicationUtils.js.map