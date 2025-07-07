define(["require", "exports", "../accUtils", "knockout", "ojs/ojarraydataprovider", "../services/logger-service", "../services/auth.service", "../services/group-service", "./userManagement/addGroupDialog", "./userManagement/editGroupDialog", "./userManagement/groupList", "./userManagement/sharedDialogUtils", "./userManagement/userManagementUtils", "./userManagement/deleteGroupDialog", "ojs/ojknockout", "ojs/ojlistview", "ojs/ojlistitemlayout", "ojs/ojbutton", "ojs/ojlabel", "ojs/ojdialog", "ojs/ojinputsearch", "ojs/ojinputtext", "ojs/ojavatar", "oj-c/checkbox", "ojs/ojavatar", "ojs/ojmodule", "ojs/ojmodule-element", "ojs/ojmodule-element-utils"], function (require, exports, AccUtils, ko, ArrayDataProvider, logger_service_1, auth_service_1, group_service_1, addGroupDialog_1, editGroupDialog_1, groupList_1, sharedDialogUtils_1, userManagementUtils_1, deleteGroupDialog_1) {
    "use strict";
    class UserManagementViewModel {
        constructor() {
            this.groupDataArray = groupList_1.groupListObservables.groupDataArray;
            this.dataProvider = groupList_1.groupListObservables.dataProvider;
            this.isDataEmpty = groupList_1.groupListObservables.isDataEmpty;
            this.searchTerm = groupList_1.groupListObservables.searchTerm;
            this.currentPage = groupList_1.groupListObservables.currentPage;
            this.totalPages = groupList_1.groupListObservables.totalPages;
            this.goToNextPage = groupList_1.groupListMethods.goToNextPage;
            this.goToPrevPage = groupList_1.groupListMethods.goToPrevPage;
            this.newGroupName = addGroupDialog_1.addGroupDialogObservables.newGroupName;
            this.searchValue = addGroupDialog_1.addGroupDialogObservables.searchValue;
            this.searchRawValue = addGroupDialog_1.addGroupDialogObservables.searchRawValue;
            this.createDialogAvailableMembers = addGroupDialog_1.addGroupDialogObservables.createDialogAvailableMembers;
            this.createDialogSelectedMembers = addGroupDialog_1.addGroupDialogObservables.createDialogSelectedMembers;
            this.createDialogApplications = addGroupDialog_1.addGroupDialogObservables.createDialogApplications;
            this.isCreating = addGroupDialog_1.addGroupDialogObservables.isCreating;
            this.createError = addGroupDialog_1.addGroupDialogObservables.createError;
            this.openAddGroupDialog = addGroupDialog_1.addGroupDialogMethods.openAddGroupDialog;
            this.closeAddGroupDialog = addGroupDialog_1.addGroupDialogMethods.closeAddGroupDialog;
            this.handleMemberSearchInput = addGroupDialog_1.addGroupDialogMethods.handleMemberSearchInput;
            this.addSelectedMembersToGroup = addGroupDialog_1.addGroupDialogMethods.addSelectedMembersToGroup;
            this.removeSelectedMembersFromGroup = addGroupDialog_1.addGroupDialogMethods.removeSelectedMembersFromGroup;
            this.removeAllSelectedMembers = addGroupDialog_1.addGroupDialogMethods.removeAllSelectedMembers;
            this.createGroup = addGroupDialog_1.addGroupDialogMethods.createGroup;
            this.addMemberToSelected = addGroupDialog_1.addGroupDialogMethods.addMemberToSelected;
            this.removeMemberFromSelected = addGroupDialog_1.addGroupDialogMethods.removeMemberFromSelected;
            this.removeAllMembersAdd = addGroupDialog_1.addGroupDialogMethods.removeAllMembers;
            this.selectedGroupName = editGroupDialog_1.editGroupDialogObservables.selectedGroupName;
            this.currentMembers = editGroupDialog_1.editGroupDialogObservables.currentMembers;
            this.editDialogAvailableMembers = editGroupDialog_1.editGroupDialogObservables.editDialogAvailableMembers;
            this.selectedAvailableMemberKeys = editGroupDialog_1.editGroupDialogObservables.selectedAvailableMemberKeys;
            this.selectedAssignedMemberKeys = editGroupDialog_1.editGroupDialogObservables.selectedAssignedMemberKeys;
            this.editSearchValue = editGroupDialog_1.editGroupDialogObservables.searchValue;
            this.editSearchRawValue = editGroupDialog_1.editGroupDialogObservables.searchRawValue;
            this.editError = editGroupDialog_1.editGroupDialogObservables.editError;
            this.editDialogApplications = editGroupDialog_1.editGroupDialogObservables.editDialogApplications;
            this.handleAvailableMemberSelection = editGroupDialog_1.editGroupDialogMethods.handleAvailableMemberSelection;
            this.handleUnselectMember = editGroupDialog_1.editGroupDialogMethods.handleUnselectMember;
            this.handleEditMemberSearchInput = editGroupDialog_1.editGroupDialogMethods.handleMemberSearchInput;
            this.openEditGroupDialog = editGroupDialog_1.editGroupDialogMethods.openEditGroupDialog;
            this.closeEditDialog = editGroupDialog_1.editGroupDialogMethods.closeEditDialog;
            this.updateGroup = editGroupDialog_1.editGroupDialogMethods.updateGroup;
            this.removeAllMembersEdit = editGroupDialog_1.editGroupDialogMethods.removeAllMembers;
            this.selectedGroupIsAdmin = editGroupDialog_1.editGroupDialogObservables.selectedGroupAdmin();
            this.getInitials = sharedDialogUtils_1.getInitials;
            this.getRelativeTime = userManagementUtils_1.getRelativeTime;
            this.createDialogAvailableMembersDP = new ArrayDataProvider(this.createDialogAvailableMembers, { keyAttributes: "id" });
            this.createDialogSelectedMembersDP = new ArrayDataProvider(this.createDialogSelectedMembers, { keyAttributes: "id" });
            this.currentMembersDP = ko.pureComputed(() => new ArrayDataProvider(this.currentMembers(), { keyAttributes: "id" }));
            this.editDialogAvailableMembersDP = new ArrayDataProvider(this.editDialogAvailableMembers, { keyAttributes: "id" });
            this.deleteGroupDialog = deleteGroupDialog_1.default;
            this.is_admin = ko.observable(false);
            this.editGroup = (group) => {
                if (!group || !group.groupId || !group.groupName) {
                    logger_service_1.default.warn("Missing groupId or groupName from data for edit action.");
                    return;
                }
                this.openEditGroupDialog({
                    detail: {
                        groupId: group.groupId,
                        groupName: group.groupName
                    }
                });
            };
            this.deleteGroup = (event) => {
                event.stopPropagation();
                event.preventDefault();
                const groupId = event.target.dataset.groupId || '';
                const group = this.groupDataArray().find(g => g.groupId === groupId);
                if (group) {
                    deleteGroupDialog_1.default.openDialog(groupId, group.groupName || '');
                }
            };
            this.onSearchInputChange = (event) => {
                this.searchTerm(event.detail.value);
                this.currentPage(1);
            };
            this.authService = new auth_service_1.AuthService();
            this.is_admin(this.authService.getIsAdminFromToken());
            this.isDataEmpty = ko.pureComputed(() => {
                return this.groupDataArray().length === 0;
            });
            groupList_1.groupListMethods.init();
            document.addEventListener('group-deleted', (e) => {
                const idToDelete = e.detail.groupId;
                this.groupDataArray.remove(group => group.groupId === idToDelete);
            });
            document.addEventListener('group-created', (e) => {
                groupList_1.groupListMethods.loadGroups();
            });
            document.addEventListener('group-updated', () => {
                (0, group_service_1.fetchUserGroups)();
            });
            window.addEventListener('authStateChanged', () => {
                this.is_admin(this.authService.getIsAdminFromToken());
            });
        }
        connected() {
            AccUtils.announce("User Management page loaded.");
            document.title = "User Management";
            this.is_admin(this.authService.getIsAdminFromToken());
        }
        disconnected() {
        }
        transitionCompleted() {
        }
    }
    return UserManagementViewModel;
});
//# sourceMappingURL=userManagement.js.map