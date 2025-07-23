import * as ko from "knockout";
import { MemberData, ApplicationOption } from "./types";
import { ObservableKeySet } from "ojs/ojknockout-keyset";
export declare const editGroupDialogObservables: {
    groupId: ko.Observable<string>;
    selectedGroupName: ko.Observable<string>;
    currentMembers: ko.ObservableArray<MemberData>;
    editDialogAvailableMembers: ko.ObservableArray<MemberData>;
    selectedAvailableMemberKeys: ko.Observable<ObservableKeySet<string | number>>;
    selectedAssignedMemberKeys: ko.Observable<ObservableKeySet<string | number>>;
    searchValue: ko.Observable<string>;
    searchRawValue: ko.Observable<string>;
    editError: ko.Observable<string>;
    editDialogApplications: ko.ObservableArray<ApplicationOption>;
    superAdminEmails: ko.ObservableArray<string>;
    selectedGroupAdmin: ko.Observable<boolean>;
};
export declare const editGroupDialogMethods: {
    handleAvailableMemberSelection: (member: MemberData) => void;
    handleUnselectMember: (member: MemberData) => void;
    handleMemberSearchInput: (event: CustomEvent<any>) => void;
    openEditGroupDialog: (event: {
        detail: {
            groupId: string;
            groupName: string;
        };
    }) => Promise<void>;
    closeEditDialog: () => void;
    updateGroup: () => Promise<void>;
    removeAllMembers: () => void;
};
