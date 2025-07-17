var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "knockout", "../../services/logger-service", "ojs/ojknockout-keyset", "../../utils/globalBanner", "../../services/group-service", "./sharedDialogUtils", "./groupList"], function (require, exports, ko, logger_service_1, ojknockout_keyset_1, globalBanner_1, group_service_1, sharedDialogUtils_1, groupList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editGroupDialogMethods = exports.editGroupDialogObservables = void 0;
    const editSearchTimeoutRef = {
        current: undefined,
    };
    exports.editGroupDialogObservables = {
        groupId: ko.observable(""),
        selectedGroupName: ko.observable(""),
        currentMembers: ko.observableArray([]),
        editDialogAvailableMembers: ko.observableArray([]),
        selectedAvailableMemberKeys: ko.observable(new ojknockout_keyset_1.ObservableKeySet()),
        selectedAssignedMemberKeys: ko.observable(new ojknockout_keyset_1.ObservableKeySet()),
        searchValue: ko.observable(""),
        searchRawValue: ko.observable(""),
        editError: ko.observable(""),
        editDialogApplications: ko.observableArray([]),
        superAdminEmails: ko.observableArray([]),
        selectedGroupAdmin: ko.observable(false),
    };
    const searchConfig = {
        availableMembersObservable: exports.editGroupDialogObservables.editDialogAvailableMembers,
        excludedMembersObservable: exports.editGroupDialogObservables.currentMembers,
        errorObservable: exports.editGroupDialogObservables.editError,
        logContext: "in edit group dialog",
    };
    exports.editGroupDialogMethods = {
        handleAvailableMemberSelection: (member) => {
            console.log("Adding member to selected in edit group dialog:", member);
            const selectedList = exports.editGroupDialogObservables.currentMembers();
            const alreadyAdded = selectedList.some((m) => m.id === member.id);
            if (!alreadyAdded) {
                exports.editGroupDialogObservables.currentMembers.push(member);
            }
            const availableList = exports.editGroupDialogObservables.editDialogAvailableMembers();
            const updatedAvailableList = availableList.filter((m) => m.id !== member.id);
            exports.editGroupDialogObservables.editDialogAvailableMembers(updatedAvailableList);
        },
        handleUnselectMember: (member) => {
            const superAdminEmails = exports.editGroupDialogObservables.superAdminEmails();
            if (superAdminEmails.includes(member.email)) {
                return;
            }
            const selectedList = exports.editGroupDialogObservables.currentMembers();
            const updatedSelectedList = selectedList.filter((m) => m.id !== member.id);
            exports.editGroupDialogObservables.currentMembers(updatedSelectedList);
            const availableList = exports.editGroupDialogObservables.editDialogAvailableMembers();
            const alreadyAvailable = availableList.some((m) => m.id === member.id);
            if (!alreadyAvailable) {
                exports.editGroupDialogObservables.editDialogAvailableMembers.push(member);
            }
        },
        handleMemberSearchInput: (0, sharedDialogUtils_1.createSearchInputHandler)(searchConfig, editSearchTimeoutRef),
        openEditGroupDialog: (event) => __awaiter(void 0, void 0, void 0, function* () {
            const { groupId, groupName } = event.detail;
            exports.editGroupDialogObservables.groupId(groupId);
            exports.editGroupDialogObservables.selectedGroupName(groupName);
            exports.editGroupDialogObservables.currentMembers([]);
            exports.editGroupDialogObservables.selectedAvailableMemberKeys(new ojknockout_keyset_1.ObservableKeySet());
            exports.editGroupDialogObservables.selectedAssignedMemberKeys(new ojknockout_keyset_1.ObservableKeySet());
            exports.editGroupDialogObservables.editDialogApplications([]);
            (0, sharedDialogUtils_1.resetSearchState)(exports.editGroupDialogObservables.searchValue, exports.editGroupDialogObservables.searchRawValue, exports.editGroupDialogObservables.editDialogAvailableMembers, exports.editGroupDialogObservables.editError);
            (0, sharedDialogUtils_1.clearSearchTimeout)(editSearchTimeoutRef);
            try {
                const [applications, groupDetails] = yield Promise.all([
                    (0, group_service_1.fetchApplicationsWithIds)(),
                    (0, group_service_1.fetchGroupById)(groupId),
                ]);
                console.log("Group details fetched for edit dialog:", groupDetails);
                const assignedApplicationIds = new Set(groupDetails.assigned_applications.map((app) => app._id));
                const applicationOptions = applications.map((app) => ({
                    id: app.id,
                    name: app.name,
                    checked: ko.observable(assignedApplicationIds.has(app.id)),
                }));
                exports.editGroupDialogObservables.editDialogApplications(applicationOptions);
                const currentMembers = groupDetails.members.map((member) => ({
                    id: member._id || `fallback-id-${member.email}`,
                    name: member.name || member.email,
                    email: member.email,
                    initials: (0, sharedDialogUtils_1.getInitials)(member.name || member.email),
                }));
                console.log("Current members:", currentMembers);
                exports.editGroupDialogObservables.currentMembers(currentMembers);
                if (groupDetails.super_admin_emails) {
                    console.log("Super admin emails:", groupDetails.super_admin_emails);
                    exports.editGroupDialogObservables.superAdminEmails(groupDetails.super_admin_emails);
                }
                exports.editGroupDialogObservables.selectedGroupAdmin(groupDetails.is_admin || false);
                console.log("selected admin status:", exports.editGroupDialogObservables.selectedGroupAdmin());
            }
            catch (error) {
                logger_service_1.default.error("Failed to fetch applications or group details for edit dialog:", error);
                exports.editGroupDialogObservables.editError("Failed to load group details.");
            }
            document.getElementById("editGroupDialog").open();
        }),
        closeEditDialog: () => {
            const dialog = document.getElementById("editGroupDialog");
            dialog === null || dialog === void 0 ? void 0 : dialog.close();
            exports.editGroupDialogObservables.selectedGroupName("");
            exports.editGroupDialogObservables.currentMembers([]);
            exports.editGroupDialogObservables.selectedAvailableMemberKeys(new ojknockout_keyset_1.ObservableKeySet());
            exports.editGroupDialogObservables.selectedAssignedMemberKeys(new ojknockout_keyset_1.ObservableKeySet());
            exports.editGroupDialogObservables.editDialogApplications([]);
            console.log("Resetting edit dialog observables");
            exports.editGroupDialogObservables.superAdminEmails([]);
            (0, sharedDialogUtils_1.resetSearchState)(exports.editGroupDialogObservables.searchValue, exports.editGroupDialogObservables.searchRawValue, exports.editGroupDialogObservables.editDialogAvailableMembers, exports.editGroupDialogObservables.editError);
            (0, sharedDialogUtils_1.clearSearchTimeout)(editSearchTimeoutRef);
        },
        updateGroup: () => __awaiter(void 0, void 0, void 0, function* () {
            const groupId = exports.editGroupDialogObservables.groupId();
            const groupName = exports.editGroupDialogObservables.selectedGroupName();
            const members = exports.editGroupDialogObservables.currentMembers();
            const selectedApplications = exports.editGroupDialogObservables
                .editDialogApplications()
                .filter((app) => app.checked());
            try {
                const updatedGroup = yield (0, group_service_1.updateUserGroup)(groupId, {
                    name: groupName,
                    members: members.map((m) => m.email),
                    applications: selectedApplications.map((app) => app.id),
                });
                logger_service_1.default.info(`Group ${groupId} updated successfully` + updatedGroup);
                console.log("Updated group details:", updatedGroup);
                const updatedGroups = groupList_1.groupListObservables.groupDataArray();
                const groupIndex = updatedGroups.findIndex((g) => g.groupId === groupId);
                if (groupIndex !== -1) {
                    console.log("Updating group in observable array:", updatedGroup);
                    const createdDate = new Date(updatedGroup.createdAt);
                    updatedGroups[groupIndex] = {
                        groupId: updatedGroup._id,
                        groupName: updatedGroup.name,
                        description: updatedGroup.is_admin
                            ? "Admin group with full privileges"
                            : "Regular user group",
                        memberCount: updatedGroup.members.length,
                        createdDate: createdDate.toLocaleDateString(),
                        createdAgo: groupList_1.groupListMethods.getRelativeTime(createdDate),
                        is_admin: updatedGroup.is_admin,
                        members: updatedGroup.members.map((member) => member.email),
                        assigned_applications: updatedGroup.assigned_applications.map((app) => app.name),
                    };
                    groupList_1.groupListObservables.groupDataArray.valueHasMutated();
                }
                globalBanner_1.default.showSuccess(`Group "${groupName}" updated successfully!`);
                exports.editGroupDialogMethods.closeEditDialog();
            }
            catch (error) {
                logger_service_1.default.error("Failed to update group:", error);
                exports.editGroupDialogObservables.editError("Failed to update group details.");
                globalBanner_1.default.showError("Failed to update group. Please try again.");
                exports.editGroupDialogMethods.closeEditDialog();
            }
        }),
        removeAllMembers: () => {
            const superAdminEmails = exports.editGroupDialogObservables.superAdminEmails();
            const currentMembers = exports.editGroupDialogObservables.currentMembers();
            const availableMembers = exports.editGroupDialogObservables.editDialogAvailableMembers();
            const remainingMembers = currentMembers.filter((member) => superAdminEmails.includes(member.email));
            const removedMembers = currentMembers.filter((member) => !superAdminEmails.includes(member.email));
            exports.editGroupDialogObservables.currentMembers(remainingMembers);
            const updatedAvailable = [
                ...availableMembers,
                ...removedMembers.filter((removed) => !availableMembers.some((existing) => existing.id === removed.id)),
            ];
            exports.editGroupDialogObservables.editDialogAvailableMembers(updatedAvailable);
        },
    };
});
//# sourceMappingURL=editGroupDialog.js.map