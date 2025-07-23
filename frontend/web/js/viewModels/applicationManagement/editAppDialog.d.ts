import * as ko from 'knockout';
export interface GroupOption {
    id: string;
    name: string;
    isAdmin: boolean;
    checked: ko.Observable<boolean>;
}
export declare const editAppDialogObservables: {
    selectedApplicationId: ko.Observable<string>;
    selectedApplicationName: ko.Observable<string>;
    selectedApplicationHostName: ko.Observable<string>;
    selectedApplicationEnv: ko.Observable<string>;
    selectedApplicationDescription: ko.Observable<string>;
    selectedApplicationIsActive: ko.Observable<boolean>;
    availableGroupsEdit: ko.ObservableArray<GroupOption>;
    editAppDialogError: ko.Observable<string>;
};
export declare const editAppDialogMethods: {
    gotoEditApplication: (event: any) => void;
    editApplication: (event: any) => void;
    openEditDialog: (appId: string) => Promise<void>;
    closeEditDialog: () => void;
    updateApplication: () => Promise<void>;
};
