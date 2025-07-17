import * as ko from 'knockout';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ApplicationData } from './types';
export declare const applicationListObservables: {
    applicationDataArray: ko.ObservableArray<ApplicationData>;
    searchQuery: ko.Observable<string>;
    currentPage: ko.Observable<number>;
    pageSize: number;
    sortOption: ko.Observable<"nameAsc" | "nameDesc" | "createdAtAsc" | "createdAtDesc" | "updatedAtAsc" | "updatedAtDesc">;
    statusFilter: ko.Observable<"all" | "active" | "inactive">;
    environmentFilter: ko.Observable<"all" | "Development" | "Testing" | "Production" | "Staging">;
};
export declare const applicationListComputed: {
    totalPages: ko.PureComputed<number>;
    paginatedApplications: ko.PureComputed<ApplicationData[]>;
    paginatedDataProvider: ko.PureComputed<ArrayDataProvider<unknown, unknown>>;
    isDataEmpty: ko.PureComputed<boolean>;
};
export declare const applicationListMethods: {
    loadApplicationData: () => Promise<void>;
};
