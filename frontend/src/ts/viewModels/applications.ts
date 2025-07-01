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
import { ObservableKeySet } from 'ojs/ojknockout-keyset';
import { InputSearchElement } from 'ojs/ojinputsearch';
import { ItemContext } from 'ojs/ojcommontypes';
import { ConfigService } from '../services/config-service';

interface ApplicationData {
    _id: string;
    name: string;
    hostname: string;
    environment: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    createdAgo: string;
}

class ApplicationViewModel {
    private readonly sampleApplicationsData = [
        {
            _id: "60f7c1f4a8a4c432dc1e1a01",
            name: "User Service",
            hostname: "user-service.internal.example.com",
            environment: "production",
            description: "Handles all user-related operations such as login and profile management.",
            createdAt: "2024-05-01T08:30:00.000Z",
            updatedAt: "2024-06-01T12:00:00.000Z",
            createdAgo: "1 month ago"
        },
        {
            _id: "60f7c1f4a8a4c432dc1e1a02",
            name: "Payment Service",
            hostname: "payment.internal.example.com",
            environment: "staging",
            description: "Manages payment workflows, invoices, and transactions.",
            createdAt: "2024-04-15T09:15:00.000Z",
            updatedAt: "2024-05-20T16:00:00.000Z",
            createdAgo: "2 months ago"
        },
        {
            _id: "60f7c1f4a8a4c432dc1e1a03",
            name: "Notification Service",
            hostname: "notify.dev.example.com",
            environment: "development",
            description: "Sends emails, SMS, and in-app notifications.",
            createdAt: "2024-06-01T10:00:00.000Z",
            updatedAt: "2024-06-15T12:45:00.000Z",
            createdAgo: "2 weeks ago"
        },
        {
            _id: "60f7c1f4a8a4c432dc1e1a04",
            name: "Analytics Engine",
            hostname: "analytics.example.com",
            environment: "production",
            description: "Analyzes user behavior and system metrics.",
            createdAt: "2024-03-10T07:00:00.000Z",
            updatedAt: "2024-05-01T09:30:00.000Z",
            createdAgo: "3 months ago"
        },
        {
            _id: "60f7c1f4a8a4c432dc1e1a05",
            name: "Admin Dashboard",
            hostname: "admin.internal.example.com",
            environment: "production",
            description: "Admin interface for internal monitoring and control.",
            createdAt: "2024-02-20T11:45:00.000Z",
            updatedAt: "2024-04-15T13:00:00.000Z",
            createdAgo: "4 months ago"
        }
    ];


    readonly applicationDataArray = ko.observableArray(this.sampleApplicationsData);
    readonly dataProvider = new ArrayDataProvider<
        ApplicationData["_id"],
        ApplicationData
    >(this.applicationDataArray, { keyAttributes: "_id" });

    // Dialog-related observables
    readonly selectedApplicationId = ko.observable<string>('');
    readonly selectedApplicationName = ko.observable<string>('');
    readonly selectedApplicationHostName = ko.observable<string>('');
    readonly selectedApplicationEnv = ko.observable<string>('');
    readonly selectedApplicationDescription = ko.observable<string>('');

    readonly availableGroups = [
        "Admin Group",
        "Development Team",
        "QA Team",
        "Operations Team",
        "Security Team"
    ];

    readonly selectedGroups = ko.observableArray<string>(["Admin Group"]); // Always selected

    //Checks if applicationDataArray is empty
    readonly isDataEmpty = () => {
        return this.applicationDataArray().length === 0;
    }

    readonly newApplication = {
        name: ko.observable(""),
        hostname: ko.observable(""),
        environment: ko.observable(null),
        description: ko.observable("")
    };

    readonly envOptions = new ArrayDataProvider(
        [
            { value: 'Development', label: 'Development' },
            { value: 'Testing', label: 'Testing' },
            { value: 'Production', label: 'Production' },
            { value: 'Staging', label: 'Staging' }
        ],
        { keyAttributes: 'value' }
    );

    resetNewAppForm = () => {
        this.newApplication.name("");
        this.newApplication.hostname("");
        this.newApplication.environment("");
        this.newApplication.description("");
    };

    //Add a new application
    addNewApplication = async () => {
        const dialog = document.getElementById("addApplicationDialog");
        if (!dialog) {
            console.error("Dialog not found");
            return;
        }

        const elements = Array.from(
            dialog.querySelectorAll("oj-c-input-text, oj-c-text-area, oj-c-select-single")
        ) as any[];

        let allValid = true;

        for (const element of elements) {
            // Wait for the component to be ready if validation is pending
            if (element.getProperty("valid") === "pending") {
                await element.whenReady();
            }

            // Trigger validation
            const validationResult = await element.validate();

            if (validationResult !== "valid") {
                allValid = false;
            }
        }

        if (!allValid) {
            return;
        }

        const app = {
            name: this.newApplication.name(),
            hostname: this.newApplication.hostname(),
            environment: this.newApplication.environment(),
            description: this.newApplication.description()
        };

        try {

            const apiUrl = ConfigService.getApiUrl();
            const response = await fetch(`${apiUrl}/applications`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(app)
            });



            if (!response.ok) throw new Error("Failed to add application");

            const createdApp = await response.json();

            this.applicationDataArray.push(createdApp);
            this.closeAddDialog();
            alert("Application added!");

        } catch (error) {
            console.error("Error adding application:", error);
            alert("Could not add application");
        }
    };

    openAddDialog = () => {
        const dialog = document.getElementById("addApplicationDialog") as any;
        if (dialog) dialog.open();
    };

    closeAddDialog = () => {
        const dialog = document.getElementById("addApplicationDialog") as any;
        if (dialog) dialog.close();
        this.resetNewAppForm();
    };

    //Navigate to edit application - placeholder functionality
    gotoEditApplication = (event: any) => {
        const selectedItem = event.detail.context.data;
        console.log('Edit application:', selectedItem.name);
    }

    //Edit application action - opens dialog
    editApplication = (event: any) => {
        const applicationId = event.target.getAttribute('data-app-id');
        const selectedItem = this.applicationDataArray().find(app => app._id.toString() === applicationId);

        if (selectedItem) {
            this.selectedApplicationName(selectedItem.name);
            this.selectedApplicationHostName(selectedItem.hostname);
            this.selectedApplicationEnv(selectedItem.environment);
            this.selectedApplicationDescription(selectedItem.description);
            this.openEditDialog();
        }
        console.log('Edit application:', selectedItem ? selectedItem.name : 'Not found');
    }

    // Dialog management methods
    openEditDialog = () => {
        const dialog = document.getElementById('editApplicationDialog') as any;
        if (dialog) {
            dialog.open();
        }
    }

    closeEditDialog = () => {
        const dialog = document.getElementById('editApplicationDialog') as any;
        if (dialog) {
            dialog.close();
        }
    }


    // Update groups assigned to the application
    updateGroupMembers = async () => {
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

    //Delete application action
    deleteApplication = (event: any) => {
        const appId = event.target.getAttribute('data-app-id');
        const selectedItem = this.applicationDataArray().find(app => app._id.toString() === appId);

        if (selectedItem && confirm(`Are you sure you want to delete the application "${selectedItem.name}"?`)) {
            this.applicationDataArray.remove(app => app._id.toString() === appId);
            alert('Application deleted successfully!');
        }
    }

    constructor() {
        // Load configuration on initialization
        ConfigService.loadConfig().catch(error => {
            console.error('Failed to load application configuration:', error);
        });
    }

    /**
     * Optional ViewModel method invoked after the View is inserted into the
     * document DOM.  The application can put logic that requires the DOM being
     * attached here.
     * This method might be called multiple times - after the View is created
     * and inserted into the DOM and after the View is reconnected
     * after being disconnected.
     */
    connected(): void {
        AccUtils.announce("Applications page loaded.");
        document.title = "Applications";
        // implement further logic if needed
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