var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "knockout", "../../services/config-service", "./appList", "../../utils/globalBanner", "../../utils/globalDialog"], function (require, exports, ko, config_service_1, appList_1, globalBanner_1, globalDialog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DeleteApplicationDialogViewModel {
        constructor() {
            this.applicationId = ko.observable('');
            this.applicationName = ko.observable('');
            this.isDeleting = ko.observable(false);
        }
        openDialog(applicationId, applicationName) {
            this.applicationId(applicationId);
            this.applicationName(applicationName);
            globalDialog_1.default.open("deleteApplicationDialog");
        }
        closeDialog() {
            globalDialog_1.default.close("deleteApplicationDialog");
        }
        confirmDelete() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    this.isDeleting(true);
                    yield this.deleteApplicationById(this.applicationId());
                    appList_1.applicationListObservables.applicationDataArray.remove(app => app._id === this.applicationId());
                    this.closeDialog();
                    globalBanner_1.default.showSuccess(`Application "${this.applicationName()}" deleted successfully!`);
                    console.info(`Application ${this.applicationName()} deleted successfully.`);
                }
                catch (e) {
                    console.error("Failed to delete application", e);
                    if (e instanceof Error) {
                        globalBanner_1.default.showError("Failed to delete application: " + e.message);
                    }
                    else {
                        globalBanner_1.default.showError("Failed to delete application: " + String(e));
                    }
                }
                finally {
                    this.isDeleting(false);
                }
            });
        }
        deleteApplicationById(applicationId) {
            return __awaiter(this, void 0, void 0, function* () {
                const apiUrl = config_service_1.ConfigService.getApiUrl();
                const token = localStorage.getItem('authToken');
                const groupsResponse = yield fetch(`${apiUrl}/applications/${applicationId}/assigned-groups`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!groupsResponse.ok) {
                    const errorBody = yield groupsResponse.text();
                    console.error(`Failed to fetch assigned groups: ${groupsResponse.status}, body: ${errorBody}`);
                    throw new Error(`Failed to fetch assigned groups. Status: ${groupsResponse.status}`);
                }
                const assignedGroups = yield groupsResponse.json();
                const assignedIds = assignedGroups.map((g) => g._id.toString());
                console.info(`Assigned groups for application ${applicationId}:`, assignedGroups);
                const deleteResponse = yield fetch(`${apiUrl}/applications/${applicationId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!deleteResponse.ok) {
                    const errorBody = yield deleteResponse.text();
                    console.error(`Delete failed with status: ${deleteResponse.status}, body: ${errorBody}`);
                    throw new Error(`Failed to delete application. Status: ${deleteResponse.status}`);
                }
                for (const groupId of assignedIds) {
                    const patchResponse = yield fetch(`${apiUrl}/user-groups/${groupId}/unassign-application`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ applicationId })
                    });
                    if (!patchResponse.ok) {
                        console.warn(`Failed to remove application ID from group ${groupId}`);
                    }
                }
            });
        }
    }
    exports.default = new DeleteApplicationDialogViewModel();
});
//# sourceMappingURL=deleteAppDialog.js.map