import * as ko from "knockout";
import { GroupData } from "./types";
export declare const groupListObservables: {
    groupDataArray: ko.ObservableArray<GroupData>;
    searchTerm: ko.Observable<string>;
    currentPage: ko.Observable<number>;
    pageSize: number;
    dataProvider: any;
    isDataEmpty: ko.PureComputed<boolean>;
    totalPages: ko.PureComputed<number>;
    filteredGroups: ko.PureComputed<GroupData[]>;
    pagedGroups: ko.PureComputed<GroupData[]>;
    expandedGroups: ko.ObservableArray<string>;
    groupMembersMap: ko.Observable<any>;
    groupAppsMap: ko.Observable<any>;
};
export declare const groupListMethods: {
    loadGroups(): Promise<void>;
    init(): Promise<void>;
    getRelativeTime(date: Date): string;
    goToNextPage(): void;
    goToPrevPage(): void;
    toggleGroupDetails: (groupId: string) => Promise<void>;
};
