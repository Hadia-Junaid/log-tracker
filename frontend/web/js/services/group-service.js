var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "./config-service"], function (require, exports, config_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deleteGroupById = void 0;
    exports.fetchUserGroups = fetchUserGroups;
    exports.createUserGroup = createUserGroup;
    exports.updateUserGroup = updateUserGroup;
    exports.fetchApplications = fetchApplications;
    exports.fetchApplicationsWithIds = fetchApplicationsWithIds;
    exports.fetchGroupById = fetchGroupById;
    exports.assignApplicationToGroup = assignApplicationToGroup;
    function fetchUserGroups() {
        return __awaiter(this, void 0, void 0, function* () {
            yield config_service_1.ConfigService.loadConfig();
            const token = localStorage.getItem('authToken');
            const res = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/user-groups`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                throw new Error("Failed to fetch user groups");
            }
            return yield res.json();
        });
    }
    function createUserGroup(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield config_service_1.ConfigService.loadConfig();
            const token = localStorage.getItem('authToken');
            const res = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/user-groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorBody = yield res.text();
                console.error(`Create group failed with status: ${res.status}, body: ${errorBody}`);
                throw new Error(`Failed to create group. Status: ${res.status}`);
            }
            return yield res.json();
        });
    }
    const deleteGroupById = (groupId) => {
        const token = localStorage.getItem('authToken');
        return fetch(`${config_service_1.ConfigService.getApiUrl()}/user-groups/${groupId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then((response) => __awaiter(void 0, void 0, void 0, function* () {
            if (!response.ok) {
                const errorBody = yield response.text();
                console.error(`Delete failed with status: ${response.status}, body: ${errorBody}`);
                throw new Error(`Failed to delete group. Status: ${response.status}`);
            }
            return response.json();
        }));
    };
    exports.deleteGroupById = deleteGroupById;
    function updateUserGroup(groupId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            yield config_service_1.ConfigService.loadConfig();
            const token = localStorage.getItem('authToken');
            const res = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/user-groups/${groupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorBody = yield res.text();
                console.error(`Update group failed with status: ${res.status}, body: ${errorBody}`);
                throw new Error(`Failed to update group. Status: ${res.status}`);
            }
            return yield res.json();
        });
    }
    function fetchApplications() {
        return __awaiter(this, void 0, void 0, function* () {
            yield config_service_1.ConfigService.loadConfig();
            const res = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/applications`);
            if (!res.ok) {
                throw new Error("Failed to fetch applications");
            }
            const response = yield res.json();
            return response.data.map((app) => app.name);
        });
    }
    function fetchApplicationsWithIds() {
        return __awaiter(this, void 0, void 0, function* () {
            yield config_service_1.ConfigService.loadConfig();
            const token = localStorage.getItem('authToken');
            const res = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/applications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                throw new Error(`Failed to fetch applications. Status: ${res.status}`);
            }
            const response = yield res.json();
            return response.data.map((app) => ({
                id: app._id,
                name: app.name
            }));
        });
    }
    function fetchGroupById(groupId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield config_service_1.ConfigService.loadConfig();
            const token = localStorage.getItem('authToken');
            const res = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/user-groups/${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                throw new Error(`Failed to fetch group details. Status: ${res.status}`);
            }
            return yield res.json();
        });
    }
    function assignApplicationToGroup(groupId, applicationId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield config_service_1.ConfigService.loadConfig();
            const token = localStorage.getItem('authToken');
            const res = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/user-groups/${groupId}/assign-application`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ applicationId })
            });
            if (!res.ok) {
                const errorBody = yield res.text();
                console.error(`Assign application failed with status: ${res.status}, body: ${errorBody}`);
                throw new Error(`Failed to assign application to group. Status: ${res.status}`);
            }
        });
    }
});
//# sourceMappingURL=group-service.js.map