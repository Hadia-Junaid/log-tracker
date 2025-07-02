import * as ko from "knockout";
import { ConfigService } from "../../services/config-service";
import { applicationListObservables } from "./appList";
import globalBanner  from "../../utils/globalBanner";

class DeleteApplicationDialogViewModel {
    applicationId = ko.observable<string>('');
    applicationName = ko.observable<string>('');
    isDeleting = ko.observable<boolean>(false);

    openDialog(applicationId: string, applicationName: string) {
        this.applicationId(applicationId);
        this.applicationName(applicationName);
        (document.getElementById('deleteApplicationDialog') as any).open();
    }

    closeDialog() {
        (document.getElementById('deleteApplicationDialog') as any).close();
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
        const response = await fetch(`${apiUrl}/applications/${applicationId}`, { 
            method: 'DELETE' 
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