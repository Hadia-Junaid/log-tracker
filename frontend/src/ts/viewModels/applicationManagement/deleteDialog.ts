import * as ko from 'knockout';
import deleteAppDialog from './deleteAppDialog';

export const deleteDialogMethods = {
  handleDeleteApp: (
    applicationDataArray: ko.ObservableArray<any>
  ) => {
    return (event: any) => {
      const button = event.target as HTMLElement;
      const appId = button.getAttribute('data-app-id');
      const selectedItem = applicationDataArray().find(app => app._id.toString() === appId);

      if (selectedItem && appId) {
        deleteAppDialog.openDialog(appId, selectedItem.name);
      }
    };
  },

  cancelDelete: () => deleteAppDialog.closeDialog(),
  confirmDelete: () => deleteAppDialog.confirmDelete(),
  isDeleting: deleteAppDialog.isDeleting,
  applicationName: deleteAppDialog.applicationName
};
