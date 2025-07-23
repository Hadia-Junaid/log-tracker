import * as ko from "knockout";
import { deleteGroupById } from "../../services/group-service";
import logger from "../../services/logger-service";
import globalBanner from "../../utils/globalBanner";

class DeleteGroupDialogViewModel {
    groupId = ko.observable<string>('');
    groupName = ko.observable<string>('');
    isDeleting = ko.observable<boolean>(false);

    constructor() {
        this.confirmDelete = this.confirmDelete.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
    }

    openDialog(groupId: string, groupName: string) {
        this.groupId(groupId);
        this.groupName(groupName);
        (document.getElementById('deleteGroupDialog') as any).open();
    }

    closeDialog() {
        (document.getElementById('deleteGroupDialog') as any).close();
    }

    async confirmDelete() {
        try {
            this.isDeleting(true);
            await deleteGroupById(this.groupId());
            document.dispatchEvent(new CustomEvent('group-deleted', { detail: { groupId: this.groupId() } }));
            this.closeDialog();
            logger.info(`${this.groupName()} deleted successfully.`);
            globalBanner.showError(`Group "${this.groupName()}" deleted successfully!`);
        } catch (e) {
            logger.error("Failed to delete group", e);
            if (e instanceof Error) {
                globalBanner.showError("Failed to delete group: " + e.message);
            } else {
                globalBanner.showError("Failed to delete group. Please try again.");
            }
        } finally {
            this.isDeleting(false);
        }
    }
}

export default new DeleteGroupDialogViewModel();