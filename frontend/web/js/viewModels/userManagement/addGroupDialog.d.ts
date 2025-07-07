import * as ko from "knockout";
import { MemberData, ApplicationOption } from "./types";
import { KeySetImpl } from "ojs/ojkeyset";
export declare const addGroupDialogObservables: {
    newGroupName: ko.Observable<string>;
    searchValue: ko.Observable<string>;
    searchRawValue: ko.Observable<string>;
    createDialogAvailableMembers: ko.ObservableArray<MemberData>;
    createDialogSelectedMembers: ko.ObservableArray<MemberData>;
    createDialogApplications: ko.ObservableArray<ApplicationOption>;
    isCreating: ko.Observable<boolean>;
    createError: ko.Observable<string>;
    createDialogAvailableSelectedKeySet: ko.Observable<KeySetImpl<unknown>>;
};
export declare const addGroupDialogMethods: {
    openAddGroupDialog: () => Promise<void>;
    closeAddGroupDialog: () => void;
    handleMemberSearchInput: (event: CustomEvent<any>) => void;
    addMemberToSelected(member: MemberData): void;
    removeMemberFromSelected(member: MemberData): void;
    removeAllMembers: () => void;
    addSelectedMembersToGroup: () => void;
    removeSelectedMembersFromGroup: () => void;
    removeAllSelectedMembers: () => void;
    createGroup: () => Promise<void>;
};
