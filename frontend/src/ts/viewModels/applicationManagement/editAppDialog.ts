import * as ko from 'knockout';
import { ApplicationData } from './types';
import { applicationListObservables } from './appList';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ConfigService } from '../../services/config-service';
import { envOptions } from './applicationUtils';
import { availableGroups, selectedGroupsForEdit } from './applicationGroups';
import globalBanner from '../../utils/globalBanner';
import globalDialog from '../../utils/globalDialog';

const selectedApplicationId = ko.observable<string>('');
const selectedApplicationName = ko.observable<string>('');
const selectedApplicationHostName = ko.observable<string>('');
const selectedApplicationEnv = ko.observable<string>('');
const selectedApplicationDescription = ko.observable<string>('');
const selectedApplicationIsActive = ko.observable<boolean>(true);

// Opens the edit dialog with pre-filled values
const editApplication = (event: any) => {
    const appId = event.target.getAttribute('data-app-id');
    const selectedItem = applicationListObservables.applicationDataArray().find(app => app._id === appId);

    if (selectedItem) {
        console.log("Selected application for edit:", selectedItem.environment);
        selectedApplicationId(selectedItem._id);
        selectedApplicationName(selectedItem.name);
        selectedApplicationHostName(selectedItem.hostname);
        selectedApplicationDescription(selectedItem.description);
        selectedApplicationIsActive(selectedItem.isActive || true);

        if (["Development", "Testing", "Production", "Staging"].includes(selectedItem.environment)) {
            console.log("Environment matches options:", selectedItem.environment);
            selectedApplicationEnv(selectedItem.environment);
        } else {
            console.warn("Environment does not match any options, setting to null");
            selectedApplicationEnv('null'); // fallback to prevent breaking select
        }


        openEditDialog();
    } else {
        console.warn('Edit application: Not found');
    }
};

// UI event navigation handler (optional, for now just logging)
const gotoEditApplication = (event: any) => {
    const selectedItem: ApplicationData = event.detail.context.data;
    console.log('Navigate to edit application:', selectedItem.name);
};

// Open/close dialog
const openEditDialog = () => globalDialog.open("editApplicationDialog");
const closeEditDialog = () => globalDialog.close("editApplicationDialog");

const updateApplication = async () => {
    const id = selectedApplicationId();
    const name = selectedApplicationName()?.trim();
    const hostname = selectedApplicationHostName()?.trim();
    const environment = selectedApplicationEnv()?.trim();
    const description = selectedApplicationDescription()?.trim();


    const dialog = document.getElementById("editApplicationDialog");
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
    if (!allValid) {
        return;
    }

    const existing = applicationListObservables.applicationDataArray().find(
        app => app.name.trim() === name.trim() && app._id !== id
    );

    if (existing) {
        closeEditDialog();
        globalBanner.showError("An application with this name already exists.");
        return;
    }

    const updatedApp: Partial<ApplicationData> = {
        name,
        hostname,
        environment,
        description,
        isActive: selectedApplicationIsActive()
    };

    try {
        const apiUrl = ConfigService.getApiUrl();
        const response = await fetch(`${apiUrl}/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedApp)
        });

        if (!response.ok) {
            closeEditDialog();
            if (response.status === 409) {
                globalBanner.showError("An application with this name already exists.");
            } else {
                globalBanner.showError("Failed to update application.");
            }
            return;
        }

        const updated = await response.json();

        // Replace the app in observable array with updated one
        const index = applicationListObservables.applicationDataArray().findIndex(app => app._id === id);
        if (index > -1) {
            applicationListObservables.applicationDataArray.splice(index, 1, updated);
        }

        closeEditDialog();
        globalBanner.showSuccess(`Application "${name}" updated successfully!`);
    } catch (error) {
        closeEditDialog();
        globalBanner.showError(`Failed to update application ${name}. Please try again!`);
    }
};

export const editAppDialogObservables = {
    selectedApplicationId,
    selectedApplicationName,
    selectedApplicationHostName,
    selectedApplicationEnv,
    selectedApplicationDescription,
    selectedApplicationIsActive,
    availableGroups,
    selectedGroups: selectedGroupsForEdit
};

export const editAppDialogMethods = {
    gotoEditApplication,
    editApplication,
    openEditDialog,
    closeEditDialog,
    updateApplication
};
