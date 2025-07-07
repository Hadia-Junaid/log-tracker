var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "knockout", "ojs/ojarraydataprovider", "../../services/group-service", "../../services/logger-service", "../../services/config-service"], function (require, exports, ko, ArrayDataProvider, group_service_1, logger_service_1, config_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.groupListMethods = exports.groupListObservables = void 0;
    exports.groupListObservables = {
        groupDataArray: ko.observableArray([]),
        searchTerm: ko.observable(""),
        currentPage: ko.observable(1),
        pageSize: 5,
        dataProvider: null,
        isDataEmpty: ko.pureComputed(() => true),
        totalPages: ko.pureComputed(() => 1),
        filteredGroups: ko.pureComputed(() => []),
        pagedGroups: ko.pureComputed(() => []),
        expandedGroups: ko.observableArray([]),
        groupMembersMap: ko.observable({}),
        groupAppsMap: ko.observable({})
    };
    exports.groupListObservables.filteredGroups = ko.pureComputed(() => {
        let term = exports.groupListObservables.searchTerm().toLowerCase();
        if (!term)
            return exports.groupListObservables.groupDataArray();
        const trimmedTerm = term.trim();
        if (!trimmedTerm)
            return exports.groupListObservables.groupDataArray();
        return exports.groupListObservables.groupDataArray().filter(group => {
            const name = group.groupName.toLowerCase();
            const desc = (group.description || '').toLowerCase();
            return name.includes(trimmedTerm) || desc.includes(trimmedTerm);
        });
    });
    exports.groupListObservables.totalPages = ko.pureComputed(() => {
        return Math.max(1, Math.ceil(exports.groupListObservables.filteredGroups().length / exports.groupListObservables.pageSize));
    });
    exports.groupListObservables.pagedGroups = ko.pureComputed(() => {
        const start = (exports.groupListObservables.currentPage() - 1) * exports.groupListObservables.pageSize;
        return exports.groupListObservables.filteredGroups().slice(start, start + exports.groupListObservables.pageSize);
    });
    exports.groupListObservables.dataProvider = ko.pureComputed(() => new ArrayDataProvider(exports.groupListObservables.pagedGroups(), { keyAttributes: "groupId" }));
    exports.groupListObservables.isDataEmpty = ko.pureComputed(() => exports.groupListObservables.groupDataArray().length === 0);
    exports.groupListMethods = {
        loadGroups() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const rawGroups = yield (0, group_service_1.fetchUserGroups)();
                    const processedGroups = rawGroups.map((group, index) => {
                        var _a, _b, _c;
                        const createdDate = new Date(group.createdAt);
                        const createdAgoText = exports.groupListMethods.getRelativeTime(createdDate);
                        return {
                            groupId: group._id || `fallback-id-${index}`,
                            groupName: group.name || `Unnamed Group ${index}`,
                            description: group.is_admin ? 'Admin group with full privileges' : 'Regular user group',
                            memberCount: ((_a = group.members) === null || _a === void 0 ? void 0 : _a.length) || 0,
                            createdDate: createdDate.toLocaleDateString(),
                            createdAgo: createdAgoText,
                            is_admin: group.is_admin || false,
                            members: ((_b = group.members) === null || _b === void 0 ? void 0 : _b.map((member) => member.email)) || [],
                            assigned_applications: ((_c = group.assigned_applications) === null || _c === void 0 ? void 0 : _c.map((app) => app.name)) || [],
                        };
                    });
                    processedGroups.sort((a, b) => {
                        if (a.is_admin)
                            return -1;
                        if (b.is_admin)
                            return 1;
                        return 0;
                    });
                    console.log("Processed Groups:", processedGroups);
                    exports.groupListObservables.groupDataArray(processedGroups);
                }
                catch (e) {
                    logger_service_1.default.error("Failed to load user groups", e);
                }
            });
        },
        init() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield config_service_1.ConfigService.loadConfig();
                    yield exports.groupListMethods.loadGroups();
                }
                catch (e) {
                    logger_service_1.default.error("Initialization failed", e);
                }
            });
        },
        getRelativeTime(date) {
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
        },
        goToNextPage() {
            if (exports.groupListObservables.currentPage() < exports.groupListObservables.totalPages()) {
                exports.groupListObservables.currentPage(exports.groupListObservables.currentPage() + 1);
            }
        },
        goToPrevPage() {
            if (exports.groupListObservables.currentPage() > 1) {
                exports.groupListObservables.currentPage(exports.groupListObservables.currentPage() - 1);
            }
        },
        toggleGroupDetails: (groupId) => __awaiter(void 0, void 0, void 0, function* () {
            const expandedList = exports.groupListObservables.expandedGroups();
            if (expandedList.includes(groupId)) {
                exports.groupListObservables.expandedGroups.remove(groupId);
                return;
            }
            try {
                const groupData = yield (0, group_service_1.fetchGroupById)(groupId);
                const members = groupData.members || [];
                const apps = groupData.assigned_applications || [];
                const membersMap = exports.groupListObservables.groupMembersMap();
                if (membersMap) {
                    membersMap[groupId] = members;
                    exports.groupListObservables.groupMembersMap.valueHasMutated();
                }
                const appsMap = exports.groupListObservables.groupAppsMap();
                if (appsMap) {
                    appsMap[groupId] = apps;
                    exports.groupListObservables.groupAppsMap.valueHasMutated();
                }
                exports.groupListObservables.expandedGroups.push(groupId);
            }
            catch (e) {
                logger_service_1.default.error(`Failed to fetch details for group ${groupId}`, e);
            }
        })
    };
});
//# sourceMappingURL=groupList.js.map