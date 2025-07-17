import * as ko from 'knockout';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
export interface GroupOption {
    id: string;
    name: string;
    isAdmin: boolean;
    checked: ko.Observable<boolean>;
}
export declare const addAppDialogObservables: {
    newApplication: {
        name: ko.Observable<string>;
        hostname: ko.Observable<string>;
        environment: ko.Observable<string | null>;
        description: ko.Observable<string>;
        isActive: ko.Observable<boolean>;
    };
    envOptions: ArrayDataProvider<unknown, unknown>;
    availableGroups: ko.ObservableArray<GroupOption>;
    addAppDialogError: ko.Observable<string>;
};
export declare const addAppDialogMethods: {
    openAddDialog: () => Promise<void>;
    closeAddDialog: () => void;
    addNewApplication: () => Promise<void>;
    resetNewAppForm: () => void;
};
