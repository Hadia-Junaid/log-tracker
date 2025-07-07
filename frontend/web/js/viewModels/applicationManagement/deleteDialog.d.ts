import * as ko from 'knockout';
export declare const deleteDialogMethods: {
    handleDeleteApp: (applicationDataArray: ko.ObservableArray<any>) => (event: any) => void;
    cancelDelete: () => void;
    confirmDelete: () => Promise<void>;
    isDeleting: ko.Observable<boolean>;
    applicationName: ko.Observable<string>;
};
