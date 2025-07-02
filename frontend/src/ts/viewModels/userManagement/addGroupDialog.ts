import * as ko from "knockout";
import { MemberData, ApplicationOption } from "./types";
import { ConfigService } from '../../services/config-service';
import logger from '../../services/logger-service';
import { fetchUserGroups, createUserGroup, fetchApplications } from '../../services/group-service';
import { ObservableKeySet } from 'ojs/ojknockout-keyset';
import ArrayDataProvider = require("ojs/ojarraydataprovider");

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

export const addGroupDialogMethods = {
    openAddGroupDialog: async () => {
        addGroupDialogObservables.newGroupName("");
        addGroupDialogObservables.searchValue("");
        addGroupDialogObservables.searchRawValue("");
        addGroupDialogObservables.createDialogAvailableMembers([]);
        addGroupDialogObservables.createDialogSelectedMembers([]);
        addGroupDialogObservables.createDialogApplications([]);
        addGroupDialogObservables.createError("");
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
        // Reset selection keys if you use them
    },
    handleMemberSearchInput: (event: CustomEvent<any>) => {},
    addSelectedMembersToGroup: () => {},
    removeSelectedMembersFromGroup: () => {},
    removeAllSelectedMembers: () => {},
    createGroup: async () => {}
}; 