define(["require", "exports", "./deleteAppDialog"], function (require, exports, deleteAppDialog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.deleteDialogMethods = void 0;
    exports.deleteDialogMethods = {
        handleDeleteApp: (applicationDataArray) => {
            return (event) => {
                const button = event.target;
                const appId = button.getAttribute('data-app-id');
                const selectedItem = applicationDataArray().find(app => app._id.toString() === appId);
                if (selectedItem && appId) {
                    deleteAppDialog_1.default.openDialog(appId, selectedItem.name);
                }
            };
        },
        cancelDelete: () => deleteAppDialog_1.default.closeDialog(),
        confirmDelete: () => deleteAppDialog_1.default.confirmDelete(),
        isDeleting: deleteAppDialog_1.default.isDeleting,
        applicationName: deleteAppDialog_1.default.applicationName
    };
});
//# sourceMappingURL=deleteDialog.js.map