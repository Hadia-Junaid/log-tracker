/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import * as AccUtils from "../accUtils";
import * as ko from "knockout";
import "ojs/ojknockout";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojlistview";
import "ojs/ojlistitemlayout";
import "ojs/ojbutton";
import "ojs/ojlabel";
import "ojs/ojdialog";
import "ojs/ojinputsearch";
import "ojs/ojformlayout";
import "ojs/ojavatar";
import "oj-c/input-text";
import "oj-c/text-area";
import "oj-c/select-single";
import 'oj-c/checkbox';
import 'ojs/ojswitch';
import { ObservableKeySet } from 'ojs/ojknockout-keyset';
import { InputSearchElement } from 'ojs/ojinputsearch';
import { ItemContext } from 'ojs/ojcommontypes';
import { ConfigService } from '../services/config-service';
import { ApplicationData } from './applicationManagement/types';
import {
    applicationListObservables,
    applicationListComputed,
    applicationListMethods
} from './applicationManagement/appList';
import { addAppDialogObservables, addAppDialogMethods } from './applicationManagement/addAppDialog';
import {
    editAppDialogObservables,
    editAppDialogMethods
} from './applicationManagement/editAppDialog';
import { deleteDialogMethods } from "./applicationManagement/deleteDialog";
import { envOptions as environmentOptions, statusFilterOptions, environmentFilterOptions } from './applicationManagement/applicationUtils';
import { sortOptions as sortOpts} from './applicationManagement/applicationUtils';


class ApplicationViewModel {

    // Observables
    readonly applicationDataArray = applicationListObservables.applicationDataArray;
    readonly searchQuery = applicationListObservables.searchQuery;
    readonly currentPage = applicationListObservables.currentPage;
    readonly pageSize = applicationListObservables.pageSize;
    sortOption = applicationListObservables.sortOption;
    statusFilter = applicationListObservables.statusFilter;
    environmentFilter = applicationListObservables.environmentFilter;
    newApplication = addAppDialogObservables.newApplication;
    envOptions = environmentOptions;
    selectedApplicationId = editAppDialogObservables.selectedApplicationId;
    selectedApplicationName = editAppDialogObservables.selectedApplicationName;
    selectedApplicationHostName = editAppDialogObservables.selectedApplicationHostName;
    selectedApplicationEnv = editAppDialogObservables.selectedApplicationEnv;
    selectedApplicationDescription = editAppDialogObservables.selectedApplicationDescription;
    selectedApplicationIsActive = editAppDialogObservables.selectedApplicationIsActive;
    availableGroups = addAppDialogObservables.availableGroups; // Shared
    selectedGroups = editAppDialogObservables.selectedGroups; // For Edit Dialog
    sortOptions = sortOpts;
    statusFilterOptions = statusFilterOptions;
    environmentFilterOptions = environmentFilterOptions;

    // Computed
    readonly totalPages = applicationListComputed.totalPages;
    readonly paginatedApplications = applicationListComputed.paginatedApplications;
    readonly paginatedDataProvider = applicationListComputed.paginatedDataProvider;
    readonly isDataEmpty = applicationListComputed.isDataEmpty;

    // Methods
    readonly loadApplicationData = applicationListMethods.loadApplicationData;
    openAddDialog = addAppDialogMethods.openAddDialog;
    closeAddDialog = addAppDialogMethods.closeAddDialog;
    addNewApplication = addAppDialogMethods.addNewApplication;
    resetNewAppForm = addAppDialogMethods.resetNewAppForm;
    editApplication = editAppDialogMethods.editApplication;
    gotoEditApplication = editAppDialogMethods.gotoEditApplication;
    openEditDialog = editAppDialogMethods.openEditDialog;
    closeEditDialog = editAppDialogMethods.closeEditDialog
    updateApplication = editAppDialogMethods.updateApplication;

    handleDeleteApp = deleteDialogMethods.handleDeleteApp(this.applicationDataArray);
    cancelDelete = deleteDialogMethods.cancelDelete;
    confirmDelete = deleteDialogMethods.confirmDelete;
    isDeleting = deleteDialogMethods.isDeleting;
    applicationName = deleteDialogMethods.applicationName;
    





    // Update groups assigned to the application
    updateGroup = async () => {
        const selectedAppnName = this.selectedApplicationName();
        const selectedApp = this.applicationDataArray().find(app => app.name === selectedAppnName);
        if (!selectedApp) {
            console.error('Selected application not found');
            return;
        }

        try {
            const apiUrl = ConfigService.getApiUrl();
            const response = await fetch(`${apiUrl}/applications/${selectedApp._id}/groups`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    groups: this.selectedGroups()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Update locally
            const updatedApp = await response.json();
            const index = this.applicationDataArray().findIndex(app => app._id === selectedApp._id);
            if (index > -1) {
                this.applicationDataArray.splice(index, 1, updatedApp);
            }

            this.closeEditDialog();
            alert('Application Group updated successfully!');

        } catch (error) {
            console.error('Error updating group members:', error);
        }

    }



    constructor() {
        // Load configuration on initialization
        AccUtils.announce("Application page loaded", "assertive");
        document.title = "Applications";



    }

    /**
     * Optional ViewModel method invoked after the View is inserted into the
     * document DOM.  The application can put logic that requires the DOM being
     * attached here.
     * This method might be called multiple times - after the View is created
     * and inserted into the DOM and after the View is reconnected
     * after being disconnected.
    */
    async connected(): Promise<void> {

        try {
            // Load configuration
            await ConfigService.loadConfig();
            // Load initial application data
            await this.loadApplicationData();
        } catch (error) {
            console.error("Error during ViewModel connected lifecycle:", error);
        }
    }

    /**
     * Optional ViewModel method invoked after the View is disconnected from the DOM.
     */
    disconnected(): void {
        // implement if needed
    }

    /**
     * Optional ViewModel method invoked after transition to the new View is complete.
     * That includes any possible animation between the old and the new View.
     */
    transitionCompleted(): void {
        // implement if needed
    }
}


export = ApplicationViewModel; 