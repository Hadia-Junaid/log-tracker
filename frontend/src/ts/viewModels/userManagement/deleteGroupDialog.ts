import * as ko from "knockout";
import { deleteGroupById } from "../../services/group-service";
import logger from "../../services/logger-service";

class DeleteGroupDialogViewModel {
    groupId = ko.observable<string>('');
    groupName = ko.observable<string>('');
    isDeleting = ko.observable<boolean>(false);

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
        } catch (e) {
            logger.error("Failed to delete group", e);
            if (e instanceof Error) {
                alert("Failed to delete group: " + e.message);
            } else {
                alert("Failed to delete group: " + String(e));
            }
        } finally {
            this.isDeleting(false);
        }
    }
}

export default new DeleteGroupDialogViewModel();
