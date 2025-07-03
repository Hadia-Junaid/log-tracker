import * as ko from "knockout";
import { ConfigService } from "../../services/config-service";
import { applicationListObservables } from "./appList";
import globalBanner from "../../utils/globalBanner";
import globalDialog from '../../utils/globalDialog';

class DeleteApplicationDialogViewModel {
    applicationId = ko.observable<string>('');
    applicationName = ko.observable<string>('');
    isDeleting = ko.observable<boolean>(false);

    openDialog(applicationId: string, applicationName: string) {
        this.applicationId(applicationId);
        this.applicationName(applicationName);
        globalDialog.open("deleteApplicationDialog");
    }

    closeDialog() {
        globalDialog.close("deleteApplicationDialog");
    }

    async confirmDelete() {
        try {
            this.isDeleting(true);
            await this.deleteApplicationById(this.applicationId());

            // Remove from local array
            applicationListObservables.applicationDataArray.remove(app => app._id === this.applicationId());

            this.closeDialog();

            globalBanner.showSuccess(`Application "${this.applicationName()}" deleted successfully!`);

            console.info(`Application ${this.applicationName()} deleted successfully.`);
        } catch (e) {
            console.error("Failed to delete application", e);
            if (e instanceof Error) {
                globalBanner.showError("Failed to delete application: " + e.message);
            } else {
                globalBanner.showError("Failed to delete application: " + String(e));
            }
        } finally {
            this.isDeleting(false);
        }
    }

    private async deleteApplicationById(applicationId: string): Promise<void> {
        const apiUrl = ConfigService.getApiUrl();
        const token = localStorage.getItem('authToken');

        // 1. Fetch groups assigned to the application
        const groupsResponse = await fetch(`${apiUrl}/applications/${applicationId}/assigned-groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!groupsResponse.ok) {
            const errorBody = await groupsResponse.text();
            console.error(`Failed to fetch assigned groups: ${groupsResponse.status}, body: ${errorBody}`);
            throw new Error(`Failed to fetch assigned groups. Status: ${groupsResponse.status}`);
        }

        const assignedGroups = await groupsResponse.json(); // Assume this returns array of group IDs

        console.info(`Assigned groups for application ${applicationId}:`, assignedGroups);

        // 2. Delete the application
        const deleteResponse = await fetch(`${apiUrl}/applications/${applicationId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!deleteResponse.ok) {
            const errorBody = await deleteResponse.text();
            console.error(`Delete failed with status: ${deleteResponse.status}, body: ${errorBody}`);
            throw new Error(`Failed to delete application. Status: ${deleteResponse.status}`);
        }

        // 3. Remove the app ID from assignedGroups in each group
        for (const groupId of assignedGroups) {
            const patchResponse = await fetch(`${apiUrl}/user-groups/${groupId}/remove-application`, {
                method: 'PATCH',
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
    }
}

export default new DeleteApplicationDialogViewModel(); 