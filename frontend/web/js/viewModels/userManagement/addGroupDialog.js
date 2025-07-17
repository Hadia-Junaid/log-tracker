var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "knockout", "../../services/group-service", "../../services/logger-service", "../../utils/globalBanner", "./sharedDialogUtils", "ojs/ojkeyset"], function (require, exports, ko, group_service_1, logger_service_1, globalBanner_1, sharedDialogUtils_1, ojkeyset_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addGroupDialogMethods = exports.addGroupDialogObservables = void 0;
    const searchTimeoutRef = {
        current: undefined,
    };
    exports.addGroupDialogObservables = {
        newGroupName: ko.observable(""),
        searchValue: ko.observable(""),
        searchRawValue: ko.observable(""),
        createDialogAvailableMembers: ko.observableArray([]),
        createDialogSelectedMembers: ko.observableArray([]),
        createDialogApplications: ko.observableArray([]),
        isCreating: ko.observable(false),
        createError: ko.observable(""),
        createDialogAvailableSelectedKeySet: ko.observable(new ojkeyset_1.KeySetImpl()),
    };
    const searchConfig = {
        availableMembersObservable: exports.addGroupDialogObservables.createDialogAvailableMembers,
        excludedMembersObservable: exports.addGroupDialogObservables.createDialogSelectedMembers,
        errorObservable: exports.addGroupDialogObservables.createError,
        logContext: "in add group dialog",
    };
    exports.addGroupDialogMethods = {
        openAddGroupDialog: () => __awaiter(void 0, void 0, void 0, function* () {
            exports.addGroupDialogObservables.newGroupName("");
            exports.addGroupDialogObservables.createDialogSelectedMembers([]);
            exports.addGroupDialogObservables.createDialogApplications([]);
            exports.addGroupDialogObservables.isCreating(false);
            (0, sharedDialogUtils_1.resetSearchState)(exports.addGroupDialogObservables.searchValue, exports.addGroupDialogObservables.searchRawValue, exports.addGroupDialogObservables.createDialogAvailableMembers, exports.addGroupDialogObservables.createError);
            (0, sharedDialogUtils_1.clearSearchTimeout)(searchTimeoutRef);
            try {
                const applications = yield (0, group_service_1.fetchApplicationsWithIds)();
                const applicationOptions = applications.map((app) => ({
                    id: app.id,
                    name: app.name,
                    checked: ko.observable(false),
                }));
                exports.addGroupDialogObservables.createDialogApplications(applicationOptions);
            }
            catch (error) {
                logger_service_1.default.error("Failed to fetch applications for add group dialog:", error);
                exports.addGroupDialogObservables.createError("Failed to load applications.");
            }
            document.getElementById("addGroupDialog").open();
        }),
        closeAddGroupDialog: () => {
            document.getElementById("addGroupDialog").close();
            exports.addGroupDialogObservables.newGroupName("");
            exports.addGroupDialogObservables.createDialogSelectedMembers([]);
            exports.addGroupDialogObservables.createDialogApplications([]);
            exports.addGroupDialogObservables.isCreating(false);
            (0, sharedDialogUtils_1.resetSearchState)(exports.addGroupDialogObservables.searchValue, exports.addGroupDialogObservables.searchRawValue, exports.addGroupDialogObservables.createDialogAvailableMembers, exports.addGroupDialogObservables.createError);
            (0, sharedDialogUtils_1.clearSearchTimeout)(searchTimeoutRef);
        },
        handleMemberSearchInput: (0, sharedDialogUtils_1.createSearchInputHandler)(searchConfig, searchTimeoutRef),
        addMemberToSelected(member) {
            console.log("Adding member to selected:", member);
            const selectedList = exports.addGroupDialogObservables.createDialogSelectedMembers();
            const alreadyAdded = selectedList.some((m) => m.id === member.id);
            if (!alreadyAdded) {
                exports.addGroupDialogObservables.createDialogSelectedMembers.push(member);
            }
            const availableList = exports.addGroupDialogObservables.createDialogAvailableMembers();
            const updatedAvailableList = availableList.filter((m) => m.id !== member.id);
            exports.addGroupDialogObservables.createDialogAvailableMembers(updatedAvailableList);
        },
        removeMemberFromSelected(member) {
            console.log("Removing member from selected:", member);
            const selectedList = exports.addGroupDialogObservables.createDialogSelectedMembers();
            const updatedSelectedList = selectedList.filter((m) => m.id !== member.id);
            exports.addGroupDialogObservables.createDialogSelectedMembers(updatedSelectedList);
            const availableList = exports.addGroupDialogObservables.createDialogAvailableMembers();
            const alreadyAvailable = availableList.some((m) => m.id === member.id);
            if (!alreadyAvailable) {
                exports.addGroupDialogObservables.createDialogAvailableMembers.push(member);
            }
        },
        removeAllMembers: () => {
            const currentList = exports.addGroupDialogObservables.createDialogSelectedMembers();
            exports.addGroupDialogObservables.createDialogSelectedMembers([]);
            exports.addGroupDialogObservables.createDialogAvailableMembers.push(...currentList);
        },
        addSelectedMembersToGroup: () => { },
        removeSelectedMembersFromGroup: () => { },
        removeAllSelectedMembers: () => { },
        createGroup: () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                exports.addGroupDialogObservables.createError("");
                const groupName = exports.addGroupDialogObservables.newGroupName().trim();
                if (!groupName) {
                    exports.addGroupDialogObservables.createError("Group name is required.");
                    return;
                }
                if (groupName.length < 5 || groupName.length > 20) {
                    exports.addGroupDialogObservables.createError("Group name must be between 5 and 20 characters.");
                    return;
                }
                const selectedApplications = exports.addGroupDialogObservables
                    .createDialogApplications()
                    .filter((app) => app.checked());
                if (selectedApplications.length === 0) {
                    exports.addGroupDialogObservables.createError("Please select at least one accessible application.");
                    return;
                }
                exports.addGroupDialogObservables.isCreating(true);
                const payload = {
                    name: groupName,
                    is_admin: false,
                    assigned_applications: selectedApplications.map((app) => app.id),
                    members: exports.addGroupDialogObservables.createDialogSelectedMembers().map((member) => member.email),
                };
                logger_service_1.default.info("Creating user group with payload:", payload);
                const createdGroup = yield (0, group_service_1.createUserGroup)(payload);
                logger_service_1.default.info("User group created successfully:", createdGroup);
                globalBanner_1.default.showSuccess(`Group "${groupName}" created successfully!`);
                exports.addGroupDialogMethods.closeAddGroupDialog();
                document.dispatchEvent(new CustomEvent("group-created", {
                    detail: { groupId: createdGroup._id, groupName: createdGroup.name },
                }));
            }
            catch (error) {
                logger_service_1.default.error("Failed to create user group:", error);
                if (error instanceof Error) {
                    exports.addGroupDialogObservables.createError(`Failed to create group: ${error.message}`);
                    globalBanner_1.default.showError(`Failed to create group: ${error.message}`);
                }
                else {
                    exports.addGroupDialogObservables.createError("Failed to create group. Please try again.");
                    globalBanner_1.default.showError("Failed to create group. Please try again.");
                }
            }
            finally {
                exports.addGroupDialogObservables.isCreating(false);
            }
        }),
    };
});
//# sourceMappingURL=addGroupDialog.js.map