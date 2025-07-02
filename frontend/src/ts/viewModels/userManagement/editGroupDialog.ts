import * as ko from "knockout";
import { MemberData, ApplicationOption } from "./types";
import logger from '../../services/logger-service';
import { ObservableKeySet } from 'ojs/ojknockout-keyset';
import { updateUserGroup, fetchApplications } from '../../services/group-service';
import {
    createSearchInputHandler,
    clearSearchTimeout,
    resetSearchState,
    SearchConfig
} from './sharedDialogUtils';

// Timeout tracking for search debouncing
const editSearchTimeoutRef = { current: undefined as ReturnType<typeof setTimeout> | undefined };

export const editGroupDialogObservables = {
    groupId: ko.observable<string>(''),
    selectedGroupName: ko.observable<string>(''),
    currentMembers: ko.observableArray<MemberData>([]),
    editDialogAvailableMembers: ko.observableArray<MemberData>([]),
    selectedAvailableMemberKeys: ko.observable<ObservableKeySet<string | number>>(new ObservableKeySet<string | number>()),
    selectedAssignedMemberKeys: ko.observable<ObservableKeySet<string | number>>(new ObservableKeySet<string | number>()),
    searchValue: ko.observable(""),
    searchRawValue: ko.observable(""),
    editError: ko.observable(""),
    editDialogApplications: ko.observableArray<ApplicationOption>([])
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
    
    openEditGroupDialog: async (event: { detail: { groupId: string; groupName: string } }) => {
        const { groupId, groupName } = event.detail;
        editGroupDialogObservables.groupId(groupId);
        editGroupDialogObservables.selectedGroupName(groupName);
        editGroupDialogObservables.currentMembers([]);
        editGroupDialogObservables.selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        editGroupDialogObservables.selectedAssignedMemberKeys(new ObservableKeySet<string | number>());
        editGroupDialogObservables.editDialogApplications([]);
        
        // Reset search state using shared utility
        resetSearchState(
            editGroupDialogObservables.searchValue,
            editGroupDialogObservables.searchRawValue,
            editGroupDialogObservables.editDialogAvailableMembers,
            editGroupDialogObservables.editError
        );
        
        // Clear search timeout
        clearSearchTimeout(editSearchTimeoutRef);
        
        try {
            // Fetch applications from the API
            const applications = await fetchApplications();
            const applicationOptions: ApplicationOption[] = applications.map(app => ({
                name: app,
                checked: ko.observable(false) // All checkboxes unchecked initially
            }));
            editGroupDialogObservables.editDialogApplications(applicationOptions);
        } catch (error) {
            logger.error('Failed to fetch applications for edit dialog:', error);
            editGroupDialogObservables.editError('Failed to load applications.');
        }
        
        (document.getElementById("editGroupDialog") as any).open();
    },
    
    closeEditDialog: () => {
        const dialog = document.getElementById("editGroupDialog") as HTMLElement & { close: () => void };
        dialog?.close();

        
        // Reset observables
        editGroupDialogObservables.selectedGroupName('');
        editGroupDialogObservables.currentMembers([]);
        editGroupDialogObservables.selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        editGroupDialogObservables.selectedAssignedMemberKeys(new ObservableKeySet<string | number>());
        editGroupDialogObservables.editDialogApplications([]);
        
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
    

updateGroupMembers: async () => {
    const groupId = editGroupDialogObservables.groupId();
    const members = editGroupDialogObservables.currentMembers();

    try {
        await updateUserGroup(groupId, {
            members: members.map(m => m.email), // assuming backend accepts email list
            // applications: {} // optionally pass updated applications
        });

        logger.info(`Group ${groupId} updated successfully`);
        const dialog = document.getElementById("editGroupDialog") as unknown as { close: () => void };
        dialog?.close();


        // Dispatch event to refresh group list
        document.dispatchEvent(new CustomEvent("group-updated"));
    } catch (err) {
        logger.error("Error updating group", err);
        editGroupDialogObservables.editError("Failed to update group. Please try again.");
    }
},

    removeAllMembers: () => {},
    removeMember: (event: CustomEvent) => {}
}; 