import * as ko from "knockout";
import { ConfigService } from "../../services/config-service";
import { applicationListObservables } from "./appList";

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
            
            // Show success banner instead of alert
            const banner = document.getElementById('globalBanner');
            if (banner) {
                banner.textContent = `Application "${this.applicationName()}" deleted successfully!`;
                banner.style.display = 'block';
                
                // Hide the banner after 5 seconds
                setTimeout(() => {
                    banner.style.display = 'none';
                }, 5000);
            }
            
            console.info(`Application ${this.applicationName()} deleted successfully.`);
        } catch (e) {
            console.error("Failed to delete application", e);
            if (e instanceof Error) {
                alert("Failed to delete application: " + e.message);
            } else {
                alert("Failed to delete application: " + String(e));
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