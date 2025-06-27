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
import "ojs/ojavatar";
import 'oj-c/checkbox';
import { ObservableKeySet } from 'ojs/ojknockout-keyset';
import { InputSearchElement } from 'ojs/ojinputsearch';
import { ItemContext } from 'ojs/ojcommontypes';
import { ConfigService } from '../services/config-service';
import logger from '../services/logger-service';

interface GroupData {
    groupId: number;
    groupName: string;
    description: string;
    memberCount: number;
    createdDate: string;
    createdAgo: string;
}

interface MemberData {
    id: number;
    email: string;
    name: string;
    initials: string;
}

class UserManagementViewModel {
    private readonly sampleGroupData = [
        {
            groupId: 1,
            groupName: "Admin Group",
            description: "System administrators with full access",
            memberCount: 2,
            createdDate: "2024-01-01",
            createdAgo: "2 week ago"
        },
        {
            groupId: 2,
            groupName: "Development Team",
            description: "Software developers and engineers",
            memberCount: 3,
            createdDate: "2024-01-08",
            createdAgo: "3 week ago"
        },
        {
            groupId: 3,
            groupName: "Operations Team",
            description: "System operations and maintenance",
            memberCount: 2,
            createdDate: "2024-01-15",
            createdAgo: "2 week ago"
        },
        {
            groupId: 4,
            groupName: "QA Team",
            description: "Quality assurance and testing",
            memberCount: 2,
            createdDate: "2024-01-22",
            createdAgo: "2 week ago"
        }
    ];

    readonly groupDataArray = ko.observableArray(this.sampleGroupData);
    readonly dataProvider = new ArrayDataProvider<
        GroupData["groupId"],
        GroupData
    >(this.groupDataArray, { keyAttributes: "groupId" });

    // Dialog-related observables
    readonly selectedGroupName = ko.observable<string>("");
    readonly searchValue = ko.observable<string>("");
    readonly searchRawValue = ko.observable<string>("");
    readonly selectedAvailableMembers = new ObservableKeySet();
    
    // Debouncing variables
    private searchTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private readonly DEBOUNCE_DELAY = 500; // 300ms delay

    // Available members from search results
    readonly availableMembers = ko.observableArray<MemberData>([]);
    
    // Current members for the selected group
    readonly currentMembers = ko.observableArray<MemberData>([
        { id: 1, email: "dev1@company.com", name: "Developer One", initials: "D1" },
        { id: 2, email: "dev2@company.com", name: "Developer Two", initials: "D2" },
        { id: 3, email: "dev3@company.com", name: "Developer Three", initials: "D3" }
    ]);

    readonly availableMembersDP = new ArrayDataProvider<MemberData["id"], MemberData>(
        this.availableMembers, { keyAttributes: "id" }
    );
    
    readonly currentMembersDP = new ArrayDataProvider<MemberData["id"], MemberData>(
        this.currentMembers, { keyAttributes: "id" }
    );

    // Application checkboxes
    readonly applications = {
        userService: ko.observable(false),
        paymentService: ko.observable(true),
        authService: ko.observable(false),
        notificationService: ko.observable(false),
        databaseService: ko.observable(true)
    };

    //Checks if groupDataArray is empty
    readonly isDataEmpty = () => {
        return this.groupDataArray().length === 0;
    }

    //Add a new group - placeholder functionality
    addNewGroup = () => {
        logger.info('Add New Group button clicked');
        
    }

    //Test dialog placeholder
    testDialog = () => {
        logger.info('Test Dialog button clicked');
        alert('Test Dialog functionality - placeholder');
    }

    //Navigate to edit group - placeholder functionality
    gotoEditGroup = (event: any) => {
        const selectedItem = event.detail.context.data;
        logger.info('Navigate to edit group requested', { groupName: selectedItem.groupName });
    }

    //Edit group action - opens dialog
    editGroup = (event: any) => {
        const groupId = event.target.getAttribute('data-group-id');
        const selectedItem = this.groupDataArray().find(group => group.groupId.toString() === groupId);
        
        if (selectedItem) {
            this.selectedGroupName(selectedItem.groupName);
            this.openEditDialog();
        }
    }

    // Dialog management methods
    openEditDialog = () => {
        const dialog = document.getElementById('editGroupDialog') as any;
        if (dialog) {
            dialog.open();
        }
    }

    closeEditDialog = () => {
        const dialog = document.getElementById('editGroupDialog') as any;
        if (dialog) {
            dialog.close();
        }
        // Clear any pending search timeout
        if (this.searchTimeoutId) {
            clearTimeout(this.searchTimeoutId);
            this.searchTimeoutId = null;
        }
        // Reset dialog state
        this.searchValue("");
        this.searchRawValue("");
        this.selectedAvailableMembers.clear();
        this.availableMembers([]);
    }

    // Handle input changes with debouncing
    handleSearchInput = (event: any) => {
        const searchString = event.detail.value;
        
        // Clear any existing timeout
        if (this.searchTimeoutId) {
            clearTimeout(this.searchTimeoutId);
        }
        
        // Set a new timeout for the debounced search
        this.searchTimeoutId = setTimeout(() => {
            this.performSearch(searchString);
        }, this.DEBOUNCE_DELAY);
    }

    // Search functionality - calls backend API
    private performSearch = async (searchString: string) => {
        logger.debug('User search initiated', { searchString });
        
        if (!searchString || searchString.trim().length === 0) {
            this.availableMembers([]);
            return;
        }

        try {
            // Get configuration and call the backend API
            const apiUrl = ConfigService.getApiUrl();
            const response = await fetch(`${apiUrl}/admin/users/search?searchString=${encodeURIComponent(searchString)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const users = await response.json();
            
            // Filter out users who are already current members
            const currentMemberEmails = this.currentMembers().map(member => member.email);
            const availableUsers = users
                .filter((user: any) => !currentMemberEmails.includes(user.email))
                .map((user: any, index: number) => ({
                    id: index + 1, // Use index as ID since we need a number
                    email: user.email,
                    name: user.name || user.email,
                    initials: this.getInitials(user.name || user.email)
                }));
            
            this.availableMembers(availableUsers);
            logger.info('User search completed successfully', { 
                searchString, 
                foundUsers: availableUsers.length 
            });
            
        } catch (error) {
            logger.error('Failed to search users from backend API', { 
                searchString, 
                error: error instanceof Error ? error.message : String(error) 
            });
            this.availableMembers([]);
            // You could show a user-friendly error message here
        }
    }

    // Helper method to generate initials
    private getInitials(name: string): string {
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    // Member selection and management
    handleAvailableMemberSelection = (event: any) => {
        const selectedKeys = event.detail.value;
        if (selectedKeys.values().size > 0) {
            const selectedId = Array.from(selectedKeys.values())[0];
            const member = this.availableMembers().find((m: MemberData) => m.id === selectedId);
            if (member) {
                // Add to current members
                this.currentMembers.push(member);
                // Clear selection
                this.selectedAvailableMembers.clear();
                // Remove from available members to prevent duplicate additions
                this.availableMembers.remove((m: MemberData) => m.id === selectedId);
            }
        }
    }

    removeMember = (event: any) => {
        const email = event.target.getAttribute('data-member-email');
        this.currentMembers.remove(member => member.email === email);
    }

    removeAllMembers = () => {
        this.currentMembers.removeAll();
    }

    // Update group with new member list and applications
    updateGroupMembers = () => {
        const applicationAccess = {
            userService: this.applications.userService(),
            paymentService: this.applications.paymentService(),
            authService: this.applications.authService(),
            notificationService: this.applications.notificationService(),
            databaseService: this.applications.databaseService()
        };
        
        logger.info('Group members update initiated', {
            groupName: this.selectedGroupName(),
            memberCount: this.currentMembers().length,
            members: this.currentMembers().map(m => m.email),
            applicationAccess
        });
        
        // Update the group's member count
        const selectedGroup = this.groupDataArray().find(group => group.groupName === this.selectedGroupName());
        if (selectedGroup) {
            selectedGroup.memberCount = this.currentMembers().length;
            // Trigger observable update
            this.groupDataArray.valueHasMutated();
        }
        
        this.closeEditDialog();
        alert('Group updated successfully!');
    }

    //Delete group action
    deleteGroup = (event: any) => {
        const groupId = event.target.getAttribute('data-group-id');
        const selectedItem = this.groupDataArray().find(group => group.groupId.toString() === groupId);
        
        if (selectedItem && confirm(`Are you sure you want to delete the group "${selectedItem.groupName}"?`)) {
            this.groupDataArray.remove(group => group.groupId.toString() === groupId);
            alert('Group deleted successfully!');
        }
    }

    constructor() {
        // Load configuration on initialization
        ConfigService.loadConfig().catch(error => {
            logger.error('Failed to load application configuration during userManagement initialization', {
                error: error instanceof Error ? error.message : String(error)
            });
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
        AccUtils.announce("User Management page loaded.");
        document.title = "User Management";
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

export = UserManagementViewModel; 