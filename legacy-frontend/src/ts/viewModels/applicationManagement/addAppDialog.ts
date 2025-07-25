import * as ko from 'knockout';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ApplicationData } from './types';
import { ConfigService } from '../../services/config-service';
import { applicationListObservables } from './appList';
import { envOptions } from './applicationUtils';
import globalBanner from '../../utils/globalBanner';
import globalDialog from '../../utils/globalDialog';
import { toggle } from 'ojs/ojoffcanvas';

export interface GroupOption {
    id: string;
    name: string;
    isAdmin: boolean;
    checked: ko.Observable<boolean>;
}
const availableGroups = ko.observableArray<GroupOption>([]);

const newApplication = {
    name: ko.observable(""),
    hostname: ko.observable(""),
    environment: ko.observable<string | null>(null),
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

const openAddDialog = async () => {
    addAppDialogError("");
    await fetchGroups();
    globalDialog.open("addApplicationDialog");
}
const closeAddDialog = () => {
    globalDialog.close("addApplicationDialog");
    resetNewAppForm();
    addAppDialogError("");
};

const fetchGroups = async () => {
    const apiUrl = ConfigService.getApiUrl();
    const token = localStorage.getItem('authToken');
    try {
        const response = await fetch(`${apiUrl}/user-groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            console.error("Failed to fetch groups:", response.statusText);
            globalBanner.showError("Failed to fetch groups.");
            return;
        }
        const groups = await response.json();

        const groupOptions: GroupOption[] = groups.map((g: any) => ({
            id: g._id,
            name: g.name,
            isAdmin: g.is_admin,
            checked: ko.observable(g.is_admin) // Admin = preselected, others = false
        }));

        availableGroups(groupOptions);

    } catch (error) {
        console.error("Error fetching groups:", error);
        globalBanner.showError("Could not fetch groups");
    }
};


const addNewApplication = async () => {
    const dialog = document.getElementById("addApplicationDialog");
    if (!dialog) {
        console.error("Dialog not found");
        return;
    }

    // Custom validation for name and description
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
        environment: newApplication.environment(null),
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

        const selectedGroupIds = availableGroups()
            .filter(group => group.checked())
            .map(group => group.id);

        // Patch user groups to assign the new app
        await fetch(`${apiUrl}/applications/${createdApp._id}/assigned-groups`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ groupIds: selectedGroupIds })
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
    addAppDialogError,
};

export const addAppDialogMethods = {
    openAddDialog,
    closeAddDialog,
    addNewApplication,
    resetNewAppForm,
};
