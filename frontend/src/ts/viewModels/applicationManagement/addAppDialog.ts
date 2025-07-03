import * as ko from 'knockout';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ApplicationData } from './types';
import { ConfigService } from '../../services/config-service';
import { applicationListObservables } from './appList';
import { envOptions } from './applicationUtils';
import globalBanner from '../../utils/globalBanner';
import globalDialog from '../../utils/globalDialog';
import { toggle } from 'ojs/ojoffcanvas';
import { selectedGroupsForAdd, selectedGroupsForEdit } from './applicationGroups';

const availableGroups = ko.observableArray<any>([]);

const newApplication = {
    name: ko.observable(""),
    hostname: ko.observable(""),
    environment: ko.observable<string | null>(null),
    description: ko.observable(""),
    isActive: ko.observable(true)
};

const resetNewAppForm = () => {
    newApplication.name("");
    newApplication.hostname("");
    newApplication.environment(null);
    newApplication.description("");
    newApplication.isActive(true);
    availableGroups([]);
};

const openAddDialog = async () => {
    globalDialog.open("addApplicationDialog");
    await fetchGroups();
}
const closeAddDialog = () => {
    globalDialog.close("addApplicationDialog");
    resetNewAppForm();
};

const fetchGroups = async () => {
    const apiUrl = ConfigService.getApiUrl();
    try {
        const response = await fetch(`${apiUrl}/user-groups`);
        if (!response.ok) {
            console.error("Failed to fetch groups:", response.statusText);
            globalBanner.showError("Failed to fetch groups.");
            return;
        }
        const groups = await response.json();
        availableGroups(groups);
        selectedGroupsForAdd.push(...groups.filter((group: any) => group.is_admin).map((group: any) => group._id));
    } catch (error) {
        console.error("Error fetching groups:", error);
        globalBanner.showError("Could not fetch groups");
    }
};

const toggleGroupSelection = (group: any) => {
    if (group.is_admin) return; // Admin is locked

    const id = group._id;
    const index = selectedGroupsForAdd.indexOf(id);
    if (index === -1) {
        selectedGroupsForAdd.push(id); // Add if not selected
    } else {
        selectedGroupsForAdd.splice(index, 1); // Remove if already selected
    }
};

const addNewApplication = async () => {
    const dialog = document.getElementById("addApplicationDialog");
    if (!dialog) {
        console.error("Dialog not found");
        return;
    }

    const elements = Array.from(
        dialog.querySelectorAll("oj-c-input-text, oj-c-text-area, oj-c-select-single")
    ) as any[];

    let allValid = true;

    for (const element of elements) {
        if (element.getProperty("valid") === "pending") {
            await element.whenReady();
        }
        const validationResult = await element.validate();
        if (validationResult !== "valid") {
            allValid = false;
        }
    }

    if (!allValid) return;

    const app = {
        name: newApplication.name(),
        hostname: newApplication.hostname(),
        environment: newApplication.environment(),
        description: newApplication.description() || "",
        isActive: newApplication.isActive()
    };

    try {
        const apiUrl = ConfigService.getApiUrl();
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiUrl}/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(app)
        });

        if (!response.ok) {
            closeAddDialog();
            if (response.status === 409) {
                globalBanner.showError("An application with this name already exists.");
            } else {
                globalBanner.showError("Failed to add application.");
            }
            return;
        }

        const createdApp = await response.json();
        applicationListObservables.applicationDataArray.push(createdApp);


        // Patch user groups to assign the new app
        await fetch(`${apiUrl}/applications/${createdApp._id}/assigned-groups`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupIds: selectedGroupsForAdd() })
        });

        closeAddDialog();
        globalBanner.showSuccess("Application added successfully!");
    } catch (error) {
        console.error("Error adding application:", error);
        closeAddDialog();
        globalBanner.showError("Could not add application");
    }
};

export const addAppDialogObservables = {
    newApplication,
    envOptions,
    availableGroups,
    selectedGroups: selectedGroupsForAdd,
};

export const addAppDialogMethods = {
    openAddDialog,
    closeAddDialog,
    addNewApplication,
    resetNewAppForm,
    toggleGroupSelection
};
