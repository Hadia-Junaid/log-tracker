import * as ko from "knockout";
import { MemberData, ApplicationOption } from "./types";
import { fetchUserGroups, createUserGroup, fetchApplications } from '../../services/group-service';
import { ObservableKeySet } from 'ojs/ojknockout-keyset';
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import logger from '../../services/logger-service';
import {
    createSearchInputHandler,
    clearSearchTimeout,
    resetSearchState,
    SearchConfig
} from './sharedDialogUtils';

// Timeout tracking for search debouncing
const searchTimeoutRef = { current: undefined as ReturnType<typeof setTimeout> | undefined };

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

// Search configuration for add group dialog
const searchConfig: SearchConfig = {
    availableMembersObservable: addGroupDialogObservables.createDialogAvailableMembers,
    excludedMembersObservable: addGroupDialogObservables.createDialogSelectedMembers,
    errorObservable: addGroupDialogObservables.createError,
    logContext: "in add group dialog"
};

export const addGroupDialogMethods = {
    openAddGroupDialog: async () => {
        // Reset all observables
        addGroupDialogObservables.newGroupName("");
        addGroupDialogObservables.createDialogSelectedMembers([]);
        addGroupDialogObservables.createDialogApplications([]);
        addGroupDialogObservables.isCreating(false);
        
        // Reset search state using shared utility
        resetSearchState(
            addGroupDialogObservables.searchValue,
            addGroupDialogObservables.searchRawValue,
            addGroupDialogObservables.createDialogAvailableMembers,
            addGroupDialogObservables.createError
        );
        
        // Clear search timeout
        clearSearchTimeout(searchTimeoutRef);
        
        try {
            // Any pre-loading logic can go here
        } catch (e) {
            logger.error('Failed to pre-load data for add group dialog', e);
            addGroupDialogObservables.createError('Failed to load data for dialog.');
        }
        
        (document.getElementById("addGroupDialog") as any).open();
    },
    
    closeAddGroupDialog: () => {
        (document.getElementById("addGroupDialog") as any).close();
        
        // Reset all observables
        addGroupDialogObservables.newGroupName("");
        addGroupDialogObservables.createDialogSelectedMembers([]);
        addGroupDialogObservables.createDialogApplications([]);
        addGroupDialogObservables.isCreating(false);
        
        // Reset search state using shared utility
        resetSearchState(
            addGroupDialogObservables.searchValue,
            addGroupDialogObservables.searchRawValue,
            addGroupDialogObservables.createDialogAvailableMembers,
            addGroupDialogObservables.createError
        );
        
        // Clear search timeout
        clearSearchTimeout(searchTimeoutRef);
    },
    
    // Use shared search handler
    handleMemberSearchInput: createSearchInputHandler(searchConfig, searchTimeoutRef),
    
    addSelectedMembersToGroup: () => {},
    removeSelectedMembersFromGroup: () => {},
    removeAllSelectedMembers: () => {},
    createGroup: async () => {}
};