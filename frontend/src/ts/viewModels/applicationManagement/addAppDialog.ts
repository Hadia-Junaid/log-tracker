import * as ko from 'knockout';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ApplicationData } from './types';
import { ConfigService } from '../../services/config-service';
import { applicationListObservables } from './appList';
import { envOptions } from './applicationUtils';
import { availableGroups, selectedGroupsForAdd } from './applicationGroups';
import globalBanner from '../../utils/globalBanner';



const newApplication = {
    name: ko.observable(""),
    hostname: ko.observable(""),
    environment: ko.observable<string | null>(null),
    description: ko.observable("")
};

const resetNewAppForm = () => {
    newApplication.name("");
    newApplication.hostname("");
    newApplication.environment(null);
    newApplication.description("");
};

const openAddDialog = () => {
    const dialog = document.getElementById("addApplicationDialog") as any;
    if (dialog) dialog.open();
};

const closeAddDialog = () => {
    const dialog = document.getElementById("addApplicationDialog") as any;
    if (dialog) dialog.close();
    resetNewAppForm();
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
        description: newApplication.description() || ""
    };

    try {
        const apiUrl = ConfigService.getApiUrl();
        const response = await fetch(`${apiUrl}/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(app)
        });

        if (!response.ok) throw new Error("Failed to add application");

        const createdApp = await response.json();
        applicationListObservables.applicationDataArray.push(createdApp);
        closeAddDialog();
        globalBanner.showSuccess("Application added successfully!");
    } catch (error) {
        console.error("Error adding application:", error);
        globalBanner.showError("Could not add application");
    }
};

export const addAppDialogObservables = {
    newApplication,
    envOptions,
    availableGroups,
    selectedGroups: selectedGroupsForAdd
};

export const addAppDialogMethods = {
    openAddDialog,
    closeAddDialog,
    addNewApplication,
    resetNewAppForm
};
