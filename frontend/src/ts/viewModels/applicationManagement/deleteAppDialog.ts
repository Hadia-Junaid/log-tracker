import * as ko from "knockout";
import { ConfigService } from "../../services/config-service";
import { applicationListObservables } from "./appList";
import globalBanner  from "../../utils/globalBanner";
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
            
            globalBanner.showError(`Application "${this.applicationName()}" deleted successfully!`);
            
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
        const response = await fetch(`${apiUrl}/applications/${applicationId}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Delete failed with status: ${response.status}, body: ${errorBody}`);
            throw new Error(`Failed to delete application. Status: ${response.status}`);
        }
        
        return response.json();
    }
}

export default new DeleteApplicationDialogViewModel(); 