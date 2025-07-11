var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "knockout", "./appList", "../../services/config-service", "../../utils/globalBanner", "../../utils/globalDialog"], function (require, exports, ko, appList_1, config_service_1, globalBanner_1, globalDialog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editAppDialogMethods = exports.editAppDialogObservables = void 0;
    const selectedApplicationId = ko.observable('');
    const selectedApplicationName = ko.observable('');
    const selectedApplicationHostName = ko.observable('');
    const selectedApplicationEnv = ko.observable('');
    const selectedApplicationDescription = ko.observable('');
    const selectedApplicationIsActive = ko.observable(true);
    const editAppDialogError = ko.observable("");
    const availableGroupsEdit = ko.observableArray([]);
    const editApplication = (event) => {
        const appId = event.target.getAttribute('data-app-id');
        const selectedItem = appList_1.applicationListObservables.applicationDataArray().find(app => app._id === appId);
        if (selectedItem) {
            selectedApplicationId(selectedItem._id);
            selectedApplicationName(selectedItem.name);
            selectedApplicationHostName(selectedItem.hostname);
            selectedApplicationDescription(selectedItem.description);
            selectedApplicationIsActive(selectedItem.isActive === true);
            if (["Development", "Testing", "Production", "Staging"].includes(selectedItem.environment)) {
                console.log("Environment matches options:", selectedItem.environment);
                selectedApplicationEnv(selectedItem.environment);
            }
            else {
                console.warn("Environment does not match any options, setting to null");
                selectedApplicationEnv('null');
            }
            openEditDialog(appId);
        }
        else {
            console.warn('Edit application: Not found');
        }
    };
    const gotoEditApplication = (event) => {
        const selectedItem = event.detail.context.data;
        console.log('Navigate to edit application:', selectedItem.name);
    };
    const openEditDialog = (appId) => __awaiter(void 0, void 0, void 0, function* () {
        editAppDialogError("");
        yield fetchGroupsForEdit(appId);
        globalDialog_1.default.open("editApplicationDialog");
    });
    const closeEditDialog = () => {
        editAppDialogError("");
        globalDialog_1.default.close("editApplicationDialog");
    };
    const fetchGroupsForEdit = (applicationId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const apiUrl = config_service_1.ConfigService.getApiUrl();
            const token = localStorage.getItem('authToken');
            const allGroupsResponse = yield fetch(`${apiUrl}/user-groups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!allGroupsResponse.ok) {
                console.error("Failed to fetch groups:", allGroupsResponse.statusText);
                globalBanner_1.default.showError("Failed to fetch groups.");
                availableGroupsEdit([]);
                return;
            }
            const allGroups = yield allGroupsResponse.json();
            console.log("Available groups for edit:", allGroups);
            const assignedGroupsResponse = yield fetch(`${apiUrl}/applications/${applicationId}/assigned-groups`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!assignedGroupsResponse.ok) {
                console.error("Failed to fetch assigned groups:", assignedGroupsResponse.statusText);
                globalBanner_1.default.showError("Failed to fetch assigned groups.");
                return;
            }
            const assignedGroups = yield assignedGroupsResponse.json();
            console.log("Assigned groups for edit:", assignedGroups);
            const assignedIds = assignedGroups.map((g) => g._id.toString());
            console.log("Assigned group IDs:", assignedIds);
            const adminGroup = allGroups.find((g) => g.is_admin);
            if (adminGroup && !assignedIds.includes(adminGroup._id.toString())) {
                assignedIds.push(adminGroup._id.toString());
            }
            const groupOptions = allGroups.map((group) => ({
                id: group._id,
                name: group.name,
                isAdmin: group.is_admin,
                checked: ko.observable(assignedIds.includes(group._id.toString()))
            }));
            console.log("Available groups for edit:", groupOptions);
            availableGroupsEdit(groupOptions);
            console.log("Available groups observable: ", availableGroupsEdit());
        }
        catch (err) {
            console.error("Failed to fetch groups for editing:", err);
            availableGroupsEdit([]);
        }
    });
    const updateApplication = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const id = selectedApplicationId();
        const name = (_a = selectedApplicationName()) === null || _a === void 0 ? void 0 : _a.trim();
        const hostname = (_b = selectedApplicationHostName()) === null || _b === void 0 ? void 0 : _b.trim();
        const environment = (_c = selectedApplicationEnv()) === null || _c === void 0 ? void 0 : _c.trim();
        const description = (_d = selectedApplicationDescription()) === null || _d === void 0 ? void 0 : _d.trim();
        if (!name) {
            editAppDialogError("Application name is required.");
            return;
        }
        if (name.length < 5 || name.length > 20) {
            editAppDialogError("Application name must be between 5 and 20 characters.");
            return;
        }
        if (!description) {
            editAppDialogError("Description is required.");
            return;
        }
        if (description.length < 10 || description.length > 100) {
            editAppDialogError("Description must be between 10 and 100 characters.");
            return;
        }
        editAppDialogError("");
        const dialog = document.getElementById("editApplicationDialog");
        if (!dialog) {
            console.error("Dialog not found");
            return;
        }
        const elements = Array.from(dialog.querySelectorAll("oj-c-input-text, oj-c-text-area, oj-c-select-single"));
        let allValid = true;
        for (const element of elements) {
            if (element.getProperty("valid") === "pending") {
                yield element.whenReady();
            }
            const validationResult = yield element.validate();
            if (validationResult !== "valid") {
                allValid = false;
            }
        }
        if (!allValid) {
            return;
        }
        const existing = appList_1.applicationListObservables.applicationDataArray().find(app => app.name.trim() === name.trim() && app._id !== id);
        if (existing) {
            closeEditDialog();
            globalBanner_1.default.showError("An application with this name already exists.");
            return;
        }
        const updatedApp = {
            name,
            hostname,
            environment,
            description,
            isActive: selectedApplicationIsActive()
        };
        try {
            const apiUrl = config_service_1.ConfigService.getApiUrl();
            const token = localStorage.getItem('authToken');
            const response = yield fetch(`${apiUrl}/applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedApp)
            });
            if (!response.ok) {
                closeEditDialog();
                if (response.status === 409) {
                    globalBanner_1.default.showError("An application with this name already exists.");
                }
                else {
                    globalBanner_1.default.showError("Failed to update application.");
                }
                return;
            }
            const updated = yield response.json();
            const index = appList_1.applicationListObservables.applicationDataArray().findIndex(app => app._id === id);
            if (index > -1) {
                appList_1.applicationListObservables.applicationDataArray.splice(index, 1, updated);
            }
            const selectedGroupIds = availableGroupsEdit()
                .filter(group => group.checked())
                .map(group => group.id);
            yield fetch(`${apiUrl}/applications/${id}/assigned-groups`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ groupIds: selectedGroupIds })
            });
            closeEditDialog();
            globalBanner_1.default.showSuccess(`Application "${name}" updated successfully!`);
        }
        catch (error) {
            closeEditDialog();
            globalBanner_1.default.showError(`Failed to update application ${name}. Please try again!`);
        }
    });
    exports.editAppDialogObservables = {
        selectedApplicationId,
        selectedApplicationName,
        selectedApplicationHostName,
        selectedApplicationEnv,
        selectedApplicationDescription,
        selectedApplicationIsActive,
        availableGroupsEdit,
        editAppDialogError,
    };
    exports.editAppDialogMethods = {
        gotoEditApplication,
        editApplication,
        openEditDialog,
        closeEditDialog,
        updateApplication,
    };
});
//# sourceMappingURL=editAppDialog.js.map