 import * as ko from "knockout";
import { MemberData, ApplicationOption } from "./types";
import { ConfigService } from '../../services/config-service';
import logger from '../../services/logger-service';
import { fetchUserGroups, createUserGroup, fetchApplications } from '../../services/group-service';
import { ObservableKeySet } from 'ojs/ojknockout-keyset';
import ArrayDataProvider = require("ojs/ojarraydataprovider");

// Constants and timeout tracking for search debouncing
const DEBOUNCE_DELAY = 300; // milliseconds
let searchTimeoutId: ReturnType<typeof setTimeout> | undefined;

export const addGroupDialogObservables = {
    newGroupName: ko.observable(""),
    searchValue: ko.observable(""),
    searchRawValue: ko.observable(""),
    createDialogAvailableMembers: ko.observableArray<MemberData>([]),
    createDialogSelectedMembers: ko.observableArray<MemberData>([]),
    createDialogApplications: ko.observableArray<ApplicationOption>([]),
    isCreating: ko.observable(false),
    createError: ko.observable("")
};

// Helper function to get user initials
const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
};

// Search functionality - calls backend API
const performSearch = async (searchString: string) => {
    logger.debug('User search initiated', { searchString });
    
    if (!searchString || searchString.trim().length === 0) {
        addGroupDialogObservables.createDialogAvailableMembers([]);
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
        
        // Filter out users who are already selected members
        const currentMemberEmails = addGroupDialogObservables.createDialogSelectedMembers().map(member => member.email);
        const availableUsers = users
            .filter((user: any) => !currentMemberEmails.includes(user.email))
            .map((user: any, index: number) => ({
                id: index + 1, // Use index as ID since we need a number
                email: user.email,
                name: user.name || user.email,
                initials: getInitials(user.name || user.email)
            }));
        
        addGroupDialogObservables.createDialogAvailableMembers(availableUsers);
        logger.info('User search completed successfully', { 
            searchString, 
            foundUsers: availableUsers.length 
        });
        
    } catch (error) {
        logger.error('Failed to search users from backend API', { 
            searchString, 
            error: error instanceof Error ? error.message : String(error) 
        });
        addGroupDialogObservables.createDialogAvailableMembers([]);
        addGroupDialogObservables.createError('Failed to search for users. Please try again.');
    }
};

export const addGroupDialogMethods = {
    openAddGroupDialog: async () => {
        addGroupDialogObservables.newGroupName("");
        addGroupDialogObservables.searchValue("");
        addGroupDialogObservables.searchRawValue("");
        addGroupDialogObservables.createDialogAvailableMembers([]);
        addGroupDialogObservables.createDialogSelectedMembers([]);
        addGroupDialogObservables.createDialogApplications([]);
        addGroupDialogObservables.createError("");
        
        // Clear any existing search timeout
        if (searchTimeoutId) {
            clearTimeout(searchTimeoutId);
            searchTimeoutId = undefined;
        }
        
        // Reset selection keys if you use them
        // (document.getElementById("addGroupDialog") as any).selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        // (document.getElementById("addGroupDialog") as any).selectedAssignedMemberKeys(new ObservableKeySet<string | number>());
        try {
            // If you have a performMemberSearch, call it here
            // await performMemberSearch("");
        } catch (e) {
            logger.error('Failed to pre-load members for add group dialog', e);
            addGroupDialogObservables.createError('Failed to load available members for dialog.');
        }
        (document.getElementById("addGroupDialog") as any).open();
    },
    closeAddGroupDialog: () => {
        (document.getElementById("addGroupDialog") as any).close();
        addGroupDialogObservables.newGroupName("");
        addGroupDialogObservables.searchValue("");
        addGroupDialogObservables.searchRawValue("");
        addGroupDialogObservables.createDialogAvailableMembers([]);
        addGroupDialogObservables.createDialogSelectedMembers([]);
        addGroupDialogObservables.createDialogApplications([]);
        addGroupDialogObservables.createError("");
        
        // Clear any existing search timeout
        if (searchTimeoutId) {
            clearTimeout(searchTimeoutId);
            searchTimeoutId = undefined;
        }
        // Reset selection keys if you use them
    },
    handleMemberSearchInput: (event: CustomEvent<any>) => {
        const searchString = event.detail.value;
        
        // Clear any existing timeout
        if (searchTimeoutId) {
            clearTimeout(searchTimeoutId);
        }
        
        // Set a new timeout for the debounced search
        searchTimeoutId = setTimeout(() => {
            performSearch(searchString);
        }, DEBOUNCE_DELAY);
    },
    addSelectedMembersToGroup: () => {},
    removeSelectedMembersFromGroup: () => {},
    removeAllSelectedMembers: () => {},
    createGroup: async () => {}
};