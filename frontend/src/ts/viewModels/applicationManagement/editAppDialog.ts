import * as ko from 'knockout';
import { ApplicationData } from './types';
import { applicationListObservables } from './appList';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ConfigService } from '../../services/config-service';
import { envOptions } from './applicationUtils';
import globalBanner from '../../utils/globalBanner';
import globalDialog from '../../utils/globalDialog';

const selectedApplicationId = ko.observable<string>('');
const selectedApplicationName = ko.observable<string>('');
const selectedApplicationHostName = ko.observable<string>('');
const selectedApplicationEnv = ko.observable<string>('');
const selectedApplicationDescription = ko.observable<string>('');
const selectedApplicationIsActive = ko.observable<boolean>(true);

export interface GroupOption {
    id: string;
    name: string;
    isAdmin: boolean;
    checked: ko.Observable<boolean>;
}
const availableGroups = ko.observableArray<GroupOption>([]);

// Opens the edit dialog with pre-filled values
const editApplication = (event: any) => {
    const appId = event.target.getAttribute('data-app-id');
    const selectedItem = applicationListObservables.applicationDataArray().find(app => app._id === appId);

    if (selectedItem) {

        selectedApplicationId(selectedItem._id);
        selectedApplicationName(selectedItem.name);
        selectedApplicationHostName(selectedItem.hostname);
        selectedApplicationDescription(selectedItem.description);
        selectedApplicationIsActive(selectedItem.isActive === true);

        if (["Development", "Testing", "Production", "Staging"].includes(selectedItem.environment)) {
            console.log("Environment matches options:", selectedItem.environment);
            selectedApplicationEnv(selectedItem.environment);
        } else {
            console.warn("Environment does not match any options, setting to null");
            selectedApplicationEnv('null'); // fallback to prevent breaking select
        }


        openEditDialog(appId);
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
const openEditDialog = async (appId: string) => {
    await fetchGroupsForEdit(appId);
    globalDialog.open("editApplicationDialog");
};

const closeEditDialog = () => globalDialog.close("editApplicationDialog");

const fetchGroupsForEdit = async (applicationId: string) => {
    try {
        const apiUrl = ConfigService.getApiUrl();
        const token = localStorage.getItem('authToken');

        // Fetch all groups
        const allGroupsResponse = await fetch(`${apiUrl}/user-groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!allGroupsResponse.ok) {
            console.error("Failed to fetch groups:", allGroupsResponse.statusText);
            globalBanner.showError("Failed to fetch groups.");
            availableGroups([]);
            return;
        }

        const allGroups = await allGroupsResponse.json();

        // Fetch assigned groups for this app
        const assignedGroupsResponse = await fetch(`${apiUrl}/applications/${applicationId}/assigned-groups`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!assignedGroupsResponse.ok) {
            console.error("Failed to fetch assigned groups:", assignedGroupsResponse.statusText);
            globalBanner.showError("Failed to fetch assigned groups.");
            return;
        }

        const assignedGroups = await assignedGroupsResponse.json();
        const assignedIds = assignedGroups.map((g: any) => g._id);

        // Ensure admin group is preselected
        const adminGroup = allGroups.find((g: any) => g.is_admin);
        if (adminGroup && !assignedIds.includes(adminGroup._id)) {
            assignedIds.push(adminGroup._id);
        }

        // Map all groups with `checked` flag
        const groupOptions: GroupOption[] = allGroups.map((group: any) => ({
            id: group._id,
            name: group.name,
            isAdmin: group.is_admin,
            checked: ko.observable<boolean>(assignedIds.includes(group._id))
        }));

        availableGroups(groupOptions);                 
    } catch (err) {
        console.error("Failed to fetch groups for editing:", err);
        availableGroups([]);
    }
};

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
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${apiUrl}/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

        const selectedGroupIds = availableGroups()
            .filter(group => group.checked())
            .map(group => group.id);

        // Patch user groups to assign the new app
        await fetch(`${apiUrl}/applications/${id}/assigned-groups`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ groupIds: selectedGroupIds })
        });

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
};

export const editAppDialogMethods = {
    gotoEditApplication,
    editApplication,
    openEditDialog,
    closeEditDialog,
    updateApplication,
};
