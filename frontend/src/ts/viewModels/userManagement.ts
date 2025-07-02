import * as AccUtils from "../accUtils";
import * as ko from "knockout";
import "ojs/ojknockout";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojlistview";
import "ojs/ojlistitemlayout";
import "ojs/ojbutton";
import "ojs/ojdialog";
import "ojs/ojinputsearch";
import 'oj-c/checkbox';
import logger from '../services/logger-service';
import { ConfigService } from '../services/config-service';
import { fetchUserGroups, createUserGroup, fetchApplications } from '../services/group-service';
import { KeySet } from 'ojs/ojkeyset';
import { ObservableKeySet } from 'ojs/ojknockout-keyset';
import { MemberData, GroupData, ApplicationOption } from "./userManagement/types";
import { addGroupDialogObservables, addGroupDialogMethods } from "./userManagement/addGroupDialog";
import { editGroupDialogObservables, editGroupDialogMethods } from "./userManagement/editGroupDialog";
import { groupListObservables, groupListMethods } from "./userManagement/groupList";
import { getInitials } from "./userManagement/sharedDialogUtils";
import { getRelativeTime } from "./userManagement/userManagementUtils";
import deleteGroupDialog from "./userManagement/deleteGroupDialog";
import "oj-c/input-text";
import "oj-c/text-area";
import "oj-c/select-single";


class UserManagementViewModel {
    // Group List
    groupDataArray = groupListObservables.groupDataArray;
    dataProvider = groupListObservables.dataProvider;
    isDataEmpty = groupListObservables.isDataEmpty;
    // Search and pagination
    searchTerm = groupListObservables.searchTerm; 
    currentPage = groupListObservables.currentPage;
    totalPages = groupListObservables.totalPages;
    goToNextPage = groupListMethods.goToNextPage;
    goToPrevPage = groupListMethods.goToPrevPage;

    // Add Group Dialog
    newGroupName = addGroupDialogObservables.newGroupName;
    searchValue = addGroupDialogObservables.searchValue;
    searchRawValue = addGroupDialogObservables.searchRawValue;
    createDialogAvailableMembers = addGroupDialogObservables.createDialogAvailableMembers;
    createDialogSelectedMembers = addGroupDialogObservables.createDialogSelectedMembers;
    createDialogApplications = addGroupDialogObservables.createDialogApplications;
    isCreating = addGroupDialogObservables.isCreating;
    createError = addGroupDialogObservables.createError;
    openAddGroupDialog = addGroupDialogMethods.openAddGroupDialog;
    closeAddGroupDialog = addGroupDialogMethods.closeAddGroupDialog;
    handleMemberSearchInput = addGroupDialogMethods.handleMemberSearchInput;
    addSelectedMembersToGroup = addGroupDialogMethods.addSelectedMembersToGroup;
    removeSelectedMembersFromGroup = addGroupDialogMethods.removeSelectedMembersFromGroup;
    removeAllSelectedMembers = addGroupDialogMethods.removeAllSelectedMembers;
    createGroup = addGroupDialogMethods.createGroup;

    // Edit Group Dialog
    selectedGroupName = editGroupDialogObservables.selectedGroupName;
    currentMembers = editGroupDialogObservables.currentMembers;
    editDialogAvailableMembers = editGroupDialogObservables.editDialogAvailableMembers;
    selectedAvailableMemberKeys = editGroupDialogObservables.selectedAvailableMemberKeys;
    selectedAssignedMemberKeys = editGroupDialogObservables.selectedAssignedMemberKeys;
    editSearchValue = editGroupDialogObservables.searchValue;
    editSearchRawValue = editGroupDialogObservables.searchRawValue;
    editError = editGroupDialogObservables.editError;
    handleAvailableMemberSelection = editGroupDialogMethods.handleAvailableMemberSelection;
    handleEditMemberSearchInput = editGroupDialogMethods.handleMemberSearchInput;
    openEditGroupDialog = editGroupDialogMethods.openEditGroupDialog;
    closeEditDialog = editGroupDialogMethods.closeEditDialog;
    updateGroupMembers = editGroupDialogMethods.updateGroupMembers;
    removeAllMembers = editGroupDialogMethods.removeAllMembers;
    removeMember = editGroupDialogMethods.removeMember;

    // Utility
    getInitials = getInitials;
    getRelativeTime = getRelativeTime;

    // DataProviders for dialogs
    createDialogAvailableMembersDP = new ArrayDataProvider(this.createDialogAvailableMembers, { keyAttributes: "id" });
    createDialogSelectedMembersDP = new ArrayDataProvider(this.createDialogSelectedMembers, { keyAttributes: "id" });
    currentMembersDP = new ArrayDataProvider(this.currentMembers, { keyAttributes: "id" });
    editDialogAvailableMembersDP = new ArrayDataProvider(this.editDialogAvailableMembers, { keyAttributes: "id" });

    applications = ko.observable({
        userService: false,
        paymentService: false,
        authService: false,
        notificationService: false,
        databaseService: false
    });

    deleteGroupDialog = deleteGroupDialog;

    constructor() {
        this.isDataEmpty = ko.pureComputed(() => {
            return this.groupDataArray().length === 0;
        });
        groupListMethods.init();

        document.addEventListener('group-deleted', (e: any) => {
            const idToDelete = e.detail.groupId;
            this.groupDataArray.remove(group => group.groupId === idToDelete);
        });

        document.addEventListener('group-created', (e: any) => {
            groupListMethods.loadGroups();
        });

        document.addEventListener('group-updated', () => {
            fetchUserGroups(); // or your method to refresh groups
     });
    }

    editGroup = (group: { groupId: string; groupName: string }) => {
        if (!group || !group.groupId || !group.groupName) {
            logger.warn("Missing groupId or groupName from data for edit action.");
            return;
        }

        this.openEditGroupDialog({
            detail: {
                groupId: group.groupId,
                groupName: group.groupName
            }
        });
    };
    deleteGroup = (event: CustomEvent) => {
        event.stopPropagation(); 
        event.preventDefault();   
        const groupId = (event.target as HTMLElement).dataset.groupId || '';
        const group = this.groupDataArray().find(g => g.groupId === groupId);
        if (group) {
            deleteGroupDialog.openDialog(groupId, group.groupName || '');
        }
    };

    

    connected(): void {
        AccUtils.announce("User Management page loaded.");
        document.title = "User Management";
    }

    disconnected(): void {
        // implement if needed
    }

    transitionCompleted(): void {
        // implement if needed
    }

    onSearchInputChange = (event: CustomEvent) => {
        this.searchTerm(event.detail.value);
        this.currentPage(1); // Optionally reset to first page on new search
    };
}

export = UserManagementViewModel;
