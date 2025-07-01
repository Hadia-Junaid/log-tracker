import * as ko from 'knockout';
import { ApplicationData } from './types';
import { applicationListObservables } from './appList';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ConfigService } from '../../services/config-service';
import { envOptions } from './applicationUtils';
import { availableGroups, selectedGroupsForEdit } from './applicationGroups';

const selectedApplicationId = ko.observable<string>('');
const selectedApplicationName = ko.observable<string>('');
const selectedApplicationHostName = ko.observable<string>('');
const selectedApplicationEnv = ko.observable<string>('');
const selectedApplicationDescription = ko.observable<string>('');

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
const openEditDialog = () => {
    const dialog = document.getElementById('editApplicationDialog') as any;
    if (dialog) dialog.open();
};

const closeEditDialog = () => {
    const dialog = document.getElementById('editApplicationDialog') as any;
    if (dialog) dialog.close();
};

const updateApplication = async () => {
    const id = selectedApplicationId();
    const updatedApp: Partial<ApplicationData> = {
        name: selectedApplicationName(),
        hostname: selectedApplicationHostName(),
        environment: selectedApplicationEnv(),
        description: selectedApplicationDescription()
    };

    try {
        const apiUrl = ConfigService.getApiUrl();
        const response = await fetch(`${apiUrl}/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedApp)
        });

        if (!response.ok) throw new Error('Failed to update application');

        const updated = await response.json();

        // Replace the app in observable array with updated one
        const index = applicationListObservables.applicationDataArray().findIndex(app => app._id === id);
        if (index > -1) {
            applicationListObservables.applicationDataArray.splice(index, 1, updated);
        }

        closeEditDialog();
        alert('Application updated!');
    } catch (error) {
        console.error('Error updating application:', error);
        alert('Could not update application');
    }
};

export const editAppDialogObservables = {
    selectedApplicationId,
    selectedApplicationName,
    selectedApplicationHostName,
    selectedApplicationEnv,
    selectedApplicationDescription,
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
