var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "knockout", "../../services/config-service", "./appList", "./applicationUtils", "../../utils/globalBanner", "../../utils/globalDialog"], function (require, exports, ko, config_service_1, appList_1, applicationUtils_1, globalBanner_1, globalDialog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addAppDialogMethods = exports.addAppDialogObservables = void 0;
    const availableGroups = ko.observableArray([]);
    const newApplication = {
        name: ko.observable(""),
        hostname: ko.observable(""),
        environment: ko.observable(null),
        description: ko.observable(""),
        isActive: ko.observable(true)
    };
    const addAppDialogError = ko.observable("");
    const resetNewAppForm = () => {
        newApplication.name("");
        newApplication.hostname("");
        newApplication.environment(null);
        newApplication.description("");
        newApplication.isActive(true);
        availableGroups([]);
    };
    const openAddDialog = () => __awaiter(void 0, void 0, void 0, function* () {
        addAppDialogError("");
        yield fetchGroups();
        globalDialog_1.default.open("addApplicationDialog");
    });
    const closeAddDialog = () => {
        globalDialog_1.default.close("addApplicationDialog");
        resetNewAppForm();
        addAppDialogError("");
    };
    const fetchGroups = () => __awaiter(void 0, void 0, void 0, function* () {
        const apiUrl = config_service_1.ConfigService.getApiUrl();
        const token = localStorage.getItem('authToken');
        try {
            const response = yield fetch(`${apiUrl}/user-groups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                console.error("Failed to fetch groups:", response.statusText);
                globalBanner_1.default.showError("Failed to fetch groups.");
                return;
            }
            const groups = yield response.json();
            const groupOptions = groups.map((g) => ({
                id: g._id,
                name: g.name,
                isAdmin: g.is_admin,
                checked: ko.observable(g.is_admin)
            }));
            availableGroups(groupOptions);
        }
        catch (error) {
            console.error("Error fetching groups:", error);
            globalBanner_1.default.showError("Could not fetch groups");
        }
    });
    const addNewApplication = () => __awaiter(void 0, void 0, void 0, function* () {
        const dialog = document.getElementById("addApplicationDialog");
        if (!dialog) {
            console.error("Dialog not found");
            return;
        }
        const name = newApplication.name().trim();
        const description = newApplication.description().trim();
        if (!name) {
            addAppDialogError("Application name is required.");
            return;
        }
        if (name.length < 5 || name.length > 20) {
            addAppDialogError("Application name must be between 5 and 20 characters.");
            return;
        }
        if (!description) {
            addAppDialogError("Description is required.");
            return;
        }
        if (description.length < 10 || description.length > 100) {
            addAppDialogError("Description must be between 10 and 100 characters.");
            return;
        }
        addAppDialogError("");
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
        if (!allValid)
            return;
        const app = {
            name: newApplication.name(),
            hostname: newApplication.hostname(),
            environment: newApplication.environment(null),
            description: newApplication.description() || "",
            isActive: newApplication.isActive()
        };
        try {
            const apiUrl = config_service_1.ConfigService.getApiUrl();
            const token = localStorage.getItem('authToken');
            const response = yield fetch(`${apiUrl}/applications`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(app)
            });
            if (!response.ok) {
                closeAddDialog();
                if (response.status === 409) {
                    globalBanner_1.default.showError("An application with this name already exists.");
                }
                else {
                    globalBanner_1.default.showError("Failed to add application.");
                }
                return;
            }
            const createdApp = yield response.json();
            appList_1.applicationListObservables.applicationDataArray.push(createdApp);
            const selectedGroupIds = availableGroups()
                .filter(group => group.checked())
                .map(group => group.id);
            yield fetch(`${apiUrl}/applications/${createdApp._id}/assigned-groups`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ groupIds: selectedGroupIds })
            });
            closeAddDialog();
            globalBanner_1.default.showSuccess("Application added successfully!");
        }
        catch (error) {
            console.error("Error adding application:", error);
            closeAddDialog();
            globalBanner_1.default.showError("Could not add application");
        }
    });
    exports.addAppDialogObservables = {
        newApplication,
        envOptions: applicationUtils_1.envOptions,
        availableGroups,
        addAppDialogError,
    };
    exports.addAppDialogMethods = {
        openAddDialog,
        closeAddDialog,
        addNewApplication,
        resetNewAppForm,
    };
});
//# sourceMappingURL=addAppDialog.js.map