import * as ko from "knockout";
declare class DeleteApplicationDialogViewModel {
    applicationId: ko.Observable<string>;
    applicationName: ko.Observable<string>;
    isDeleting: ko.Observable<boolean>;
    openDialog(applicationId: string, applicationName: string): void;
    closeDialog(): void;
    confirmDelete(): Promise<void>;
    private deleteApplicationById;
}
declare const _default: DeleteApplicationDialogViewModel;
export default _default;
