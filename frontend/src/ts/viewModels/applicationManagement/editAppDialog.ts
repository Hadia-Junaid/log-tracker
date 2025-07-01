import * as ko from 'knockout';
import { ApplicationData } from './types';
import { applicationListObservables } from './appList';

const selectedApplicationId = ko.observable<string>('');
const selectedApplicationName = ko.observable<string>('');
const selectedApplicationHostName = ko.observable<string>('');
const selectedApplicationEnv = ko.observable<string>('');
const selectedApplicationDescription = ko.observable<string>('');

// Opens the edit dialog with pre-filled values
const editApplication = (event: any) => {
  const appId = event.target.getAttribute('data-app-id');
  const selectedItem = applicationListObservables.applicationDataArray().find(app => app._id === appId);

  if (selectedItem) {
    selectedApplicationId(selectedItem._id);
    selectedApplicationName(selectedItem.name);
    selectedApplicationHostName(selectedItem.hostname);
    selectedApplicationEnv(selectedItem.environment);
    selectedApplicationDescription(selectedItem.description);
    openEditDialog();
  } else {
    console.warn('Edit application: Not found');
  }
};

// UI event navigation handler (optional, for now just logging)
const gotoEditApplication = (event: any) => {
  const selectedItem: ApplicationData = event.detail.context.data;
  console.log('Navigate to edit application:', selectedItem.name);
};

// Open/close dialog
const openEditDialog = () => {
  const dialog = document.getElementById('editApplicationDialog') as any;
  if (dialog) dialog.open();
};

const closeEditDialog = () => {
  const dialog = document.getElementById('editApplicationDialog') as any;
  if (dialog) dialog.close();
};

export const editAppDialogObservables = {
  selectedApplicationId,
  selectedApplicationName,
  selectedApplicationHostName,
  selectedApplicationEnv,
  selectedApplicationDescription
};

export const editAppDialogMethods = {
  gotoEditApplication,
  editApplication,
  openEditDialog,
  closeEditDialog
};
