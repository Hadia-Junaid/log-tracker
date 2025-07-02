import * as ko from "knockout";
import { MemberData } from "./types";
import logger from '../../services/logger-service';
import { ObservableKeySet } from 'ojs/ojknockout-keyset';
import {
    createSearchInputHandler,
    clearSearchTimeout,
    resetSearchState,
    SearchConfig
} from './sharedDialogUtils';

// Timeout tracking for search debouncing
const editSearchTimeoutRef = { current: undefined as ReturnType<typeof setTimeout> | undefined };

export const editGroupDialogObservables = {
    selectedGroupName: ko.observable<string>(''),
    currentMembers: ko.observableArray<MemberData>([]),
    editDialogAvailableMembers: ko.observableArray<MemberData>([]),
    selectedAvailableMemberKeys: ko.observable<ObservableKeySet<string | number>>(new ObservableKeySet<string | number>()),
    selectedAssignedMemberKeys: ko.observable<ObservableKeySet<string | number>>(new ObservableKeySet<string | number>()),
    searchValue: ko.observable(""),
    searchRawValue: ko.observable(""),
    editError: ko.observable("")
};

// Search configuration for edit group dialog
const searchConfig: SearchConfig = {
    availableMembersObservable: editGroupDialogObservables.editDialogAvailableMembers,
    excludedMembersObservable: editGroupDialogObservables.currentMembers,
    errorObservable: editGroupDialogObservables.editError,
    logContext: "in edit group dialog"
};

export const editGroupDialogMethods = {
    handleAvailableMemberSelection: (event: CustomEvent) => {},
    
    // Use shared search handler
    handleMemberSearchInput: createSearchInputHandler(searchConfig, editSearchTimeoutRef),
    
    openEditGroupDialog: (event: CustomEvent) => {
        // Reset observables
        editGroupDialogObservables.selectedGroupName('');
        editGroupDialogObservables.currentMembers([]);
        editGroupDialogObservables.selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        editGroupDialogObservables.selectedAssignedMemberKeys(new ObservableKeySet<string | number>());
        
        // Reset search state using shared utility
        resetSearchState(
            editGroupDialogObservables.searchValue,
            editGroupDialogObservables.searchRawValue,
            editGroupDialogObservables.editDialogAvailableMembers,
            editGroupDialogObservables.editError
        );
        
        // Clear search timeout
        clearSearchTimeout(editSearchTimeoutRef);
        
        (document.getElementById("editGroupDialog") as any).open();
    },
    
    closeEditDialog: () => {
        (document.getElementById("editGroupDialog") as any).close();
        
        // Reset observables
        editGroupDialogObservables.selectedGroupName('');
        editGroupDialogObservables.currentMembers([]);
        editGroupDialogObservables.selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        editGroupDialogObservables.selectedAssignedMemberKeys(new ObservableKeySet<string | number>());
        
        // Reset search state using shared utility
        resetSearchState(
            editGroupDialogObservables.searchValue,
            editGroupDialogObservables.searchRawValue,
            editGroupDialogObservables.editDialogAvailableMembers,
            editGroupDialogObservables.editError
        );
        
        // Clear search timeout
        clearSearchTimeout(editSearchTimeoutRef);
    },
    
    updateGroupMembers: () => {},
    removeAllMembers: () => {},
    removeMember: (event: CustomEvent) => {}
}; 