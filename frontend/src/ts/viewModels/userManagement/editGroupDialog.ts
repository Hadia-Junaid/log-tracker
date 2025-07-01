import * as ko from "knockout";
import { MemberData } from "./types";
import logger from '../../services/logger-service';
import { ObservableKeySet } from 'ojs/ojknockout-keyset';

export const editGroupDialogObservables = {
    selectedGroupName: ko.observable<string>(''),
    currentMembers: ko.observableArray<MemberData>([]),
    editDialogAvailableMembers: ko.observableArray<MemberData>([]),
    selectedAvailableMemberKeys: ko.observable<ObservableKeySet<string | number>>(new ObservableKeySet<string | number>()),
    selectedAssignedMemberKeys: ko.observable<ObservableKeySet<string | number>>(new ObservableKeySet<string | number>())
};

export const editGroupDialogMethods = {
    handleAvailableMemberSelection: (event: CustomEvent) => {},
    openEditGroupDialog: (event: CustomEvent) => {
        editGroupDialogObservables.selectedGroupName('');
        editGroupDialogObservables.editDialogAvailableMembers([]);
        editGroupDialogObservables.currentMembers([]);
        editGroupDialogObservables.selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        editGroupDialogObservables.selectedAssignedMemberKeys(new ObservableKeySet<string | number>());
        (document.getElementById("editGroupDialog") as any).open();
    },
    closeEditDialog: () => {
        (document.getElementById("editGroupDialog") as any).close();
        editGroupDialogObservables.selectedGroupName('');
        editGroupDialogObservables.editDialogAvailableMembers([]);
        editGroupDialogObservables.currentMembers([]);
        editGroupDialogObservables.selectedAvailableMemberKeys(new ObservableKeySet<string | number>());
        editGroupDialogObservables.selectedAssignedMemberKeys(new ObservableKeySet<string | number>());
    },
    updateGroupMembers: () => {},
    removeAllMembers: () => {},
    removeMember: (event: CustomEvent) => {}
}; 