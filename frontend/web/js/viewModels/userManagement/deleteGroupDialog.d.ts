import * as ko from "knockout";
declare class DeleteGroupDialogViewModel {
    groupId: ko.Observable<string>;
    groupName: ko.Observable<string>;
    isDeleting: ko.Observable<boolean>;
    constructor();
    openDialog(groupId: string, groupName: string): void;
    closeDialog(): void;
    confirmDelete(): Promise<void>;
}
declare const _default: DeleteGroupDialogViewModel;
export default _default;
