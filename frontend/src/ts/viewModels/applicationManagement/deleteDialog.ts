import * as ko from 'knockout';
import { ConfigService } from '../../services/config-service';
import { ApplicationData } from './types';

// Core deletion logic
export const deleteDialogObservables = {
    deleteApplication: async (
        event: any,
        applicationDataArray: ko.ObservableArray<ApplicationData>,
        loadApplicationData: () => Promise<void>
    ) => {
        const appId = event.target.getAttribute('data-app-id');
        const selectedItem = applicationDataArray().find(app => app._id.toString() === appId);

        if (!selectedItem) {
            console.error("Application not found");
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete the application "${selectedItem.name}"?`);
        if (!confirmed) return;

        try {
            const apiUrl = ConfigService.getApiUrl();
            const response = await fetch(`${apiUrl}/applications/${appId}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error(`Failed to delete application: ${response.status}`);
            }

            alert('Application deleted successfully!');
            await loadApplicationData();
        } catch (error) {
            console.error("Error deleting application:", error);
            alert("Could not delete application. Please try again.");
        }
    }
};

// Export wrapper method for view-model binding
export const deleteDialogMethods = {
    handleDeleteApp: (
        applicationDataArray: ko.ObservableArray<ApplicationData>,
        loadApplicationData: () => Promise<void>
    ) => {
        return (event: any) => {
            deleteDialogObservables.deleteApplication(event, applicationDataArray, loadApplicationData);
        };
    }
};
