var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "knockout", "ojs/ojarraydataprovider", "../../services/config-service"], function (require, exports, ko, ArrayDataProvider, config_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applicationListMethods = exports.applicationListComputed = exports.applicationListObservables = void 0;
    exports.applicationListObservables = {
        applicationDataArray: ko.observableArray([]),
        searchQuery: ko.observable(''),
        currentPage: ko.observable(1),
        pageSize: 5,
        sortOption: ko.observable('createdAtDesc'),
        statusFilter: ko.observable('all'),
        environmentFilter: ko.observable('all')
    };
    exports.applicationListObservables.searchQuery.subscribe(() => {
        exports.applicationListObservables.currentPage(1);
    });
    exports.applicationListObservables.sortOption.subscribe(() => {
        exports.applicationListObservables.currentPage(1);
    });
    exports.applicationListObservables.statusFilter.subscribe(() => {
        exports.applicationListObservables.currentPage(1);
    });
    exports.applicationListObservables.environmentFilter.subscribe(() => {
        exports.applicationListObservables.currentPage(1);
    });
    const paginatedApplications = ko.pureComputed(() => {
        const query = exports.applicationListObservables.searchQuery().toLowerCase().trim();
        const sort = exports.applicationListObservables.sortOption();
        const statusFilter = exports.applicationListObservables.statusFilter();
        const environmentFilter = exports.applicationListObservables.environmentFilter();
        const filtered = exports.applicationListObservables.applicationDataArray().filter(app => {
            const matchesSearch = app.name.toLowerCase().includes(query) ||
                app.hostname.toLowerCase().includes(query) ||
                app.environment.toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && app.isActive === true) ||
                (statusFilter === 'inactive' && app.isActive !== true);
            const matchesEnvironment = environmentFilter === 'all' ||
                app.environment === environmentFilter;
            return matchesSearch && matchesStatus && matchesEnvironment;
        });
        const sorted = [...filtered].sort((a, b) => {
            switch (sort) {
                case 'nameAsc':
                    return a.name.localeCompare(b.name);
                case 'nameDesc':
                    return b.name.localeCompare(a.name);
                case 'createdAtAsc':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'createdAtDesc':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'updatedAtAsc':
                    return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                case 'updatedAtDesc':
                default:
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
        });
        const startIdx = (exports.applicationListObservables.currentPage() - 1) * exports.applicationListObservables.pageSize;
        return sorted.slice(startIdx, startIdx + exports.applicationListObservables.pageSize);
    });
    exports.applicationListComputed = {
        totalPages: ko.pureComputed(() => {
            const query = exports.applicationListObservables.searchQuery().toLowerCase().trim();
            const statusFilter = exports.applicationListObservables.statusFilter();
            const environmentFilter = exports.applicationListObservables.environmentFilter();
            const totalItems = exports.applicationListObservables.applicationDataArray().filter(app => {
                const matchesSearch = app.name.toLowerCase().includes(query) ||
                    app.hostname.toLowerCase().includes(query) ||
                    app.environment.toLowerCase().includes(query);
                const matchesStatus = statusFilter === 'all' ||
                    (statusFilter === 'active' && app.isActive === true) ||
                    (statusFilter === 'inactive' && app.isActive !== true);
                const matchesEnvironment = environmentFilter === 'all' ||
                    app.environment === environmentFilter;
                return matchesSearch && matchesStatus && matchesEnvironment;
            }).length;
            return Math.ceil(totalItems / exports.applicationListObservables.pageSize);
        }),
        paginatedApplications,
        paginatedDataProvider: ko.pureComputed(() => new ArrayDataProvider(paginatedApplications(), { keyAttributes: '_id' })),
        isDataEmpty: ko.pureComputed(() => exports.applicationListObservables.applicationDataArray().length === 0)
    };
    exports.applicationListMethods = {
        loadApplicationData: () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const baseUrl = config_service_1.ConfigService.getApiUrl();
                const token = localStorage.getItem('authToken');
                const response = yield fetch(`${baseUrl}/applications`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const json = yield response.json();
                if (response.ok) {
                    const sorted = json.data.sort((a, b) => {
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                    console.log('Loaded applications with isActive values:', sorted.map((app) => ({ name: app.name, isActive: app.isActive })));
                    exports.applicationListObservables.applicationDataArray(sorted);
                    console.log(`Loaded ${sorted.length} applications`);
                }
                else {
                    console.error('API Error', json);
                }
            }
            catch (err) {
                console.error('Fetch error', err);
            }
        })
    };
});
//# sourceMappingURL=appList.js.map