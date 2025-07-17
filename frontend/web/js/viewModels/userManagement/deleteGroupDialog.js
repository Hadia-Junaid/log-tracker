var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "knockout", "../../services/group-service", "../../services/logger-service", "../../utils/globalBanner"], function (require, exports, ko, group_service_1, logger_service_1, globalBanner_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DeleteGroupDialogViewModel {
        constructor() {
            this.groupId = ko.observable('');
            this.groupName = ko.observable('');
            this.isDeleting = ko.observable(false);
            this.confirmDelete = this.confirmDelete.bind(this);
            this.closeDialog = this.closeDialog.bind(this);
        }
        openDialog(groupId, groupName) {
            this.groupId(groupId);
            this.groupName(groupName);
            document.getElementById('deleteGroupDialog').open();
        }
        closeDialog() {
            document.getElementById('deleteGroupDialog').close();
        }
        confirmDelete() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    this.isDeleting(true);
                    yield (0, group_service_1.deleteGroupById)(this.groupId());
                    document.dispatchEvent(new CustomEvent('group-deleted', { detail: { groupId: this.groupId() } }));
                    this.closeDialog();
                    logger_service_1.default.info(`${this.groupName()} deleted successfully.`);
                    globalBanner_1.default.showError(`Group "${this.groupName()}" deleted successfully!`);
                }
                catch (e) {
                    logger_service_1.default.error("Failed to delete group", e);
                    if (e instanceof Error) {
                        globalBanner_1.default.showError("Failed to delete group: " + e.message);
                    }
                    else {
                        globalBanner_1.default.showError("Failed to delete group. Please try again.");
                    }
                }
                finally {
                    this.isDeleting(false);
                }
            });
        }
    }
    exports.default = new DeleteGroupDialogViewModel();
});
//# sourceMappingURL=deleteGroupDialog.js.map