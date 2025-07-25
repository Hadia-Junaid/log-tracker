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
import { envOptions as environmentOptions, statusFilterOptions, environmentFilterOptions, getRelativeTime } from './applicationManagement/applicationUtils';
import { sortOptions as sortOpts} from './applicationManagement/applicationUtils';
import { AuthService } from '../services/auth.service';
declare const jwt_decode: (token: string) => any;


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
    availableGroups = addAppDialogObservables.availableGroups;
    availableGroupsEdit = editAppDialogObservables.availableGroupsEdit;
    sortOptions = sortOpts;
    isAdmin = ko.observable(false);
    statusFilterOptions = statusFilterOptions;
    environmentFilterOptions = environmentFilterOptions;
    private authService: AuthService;
    addAppDialogError = addAppDialogObservables.addAppDialogError;
    editAppDialogError = editAppDialogObservables.editAppDialogError;
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
    getRelativeTime = getRelativeTime;

    handleDeleteApp = deleteDialogMethods.handleDeleteApp(this.applicationDataArray);
    cancelDelete = deleteDialogMethods.cancelDelete;
    confirmDelete = deleteDialogMethods.confirmDelete;
    isDeleting = deleteDialogMethods.isDeleting;
    applicationName = deleteDialogMethods.applicationName;
    

    constructor() {
        this.authService = new AuthService();
        
        // Set admin status from auth service
        this.isAdmin(this.authService.getIsAdminFromToken());

        // Listen for auth state changes
        window.addEventListener('authStateChanged', () => {
            this.isAdmin(this.authService.getIsAdminFromToken());
        });

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
            // Verify admin status on page load
            this.isAdmin(this.authService.getIsAdminFromToken());
            
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