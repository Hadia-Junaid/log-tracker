import * as ko from "knockout";
import { MemberData } from "./types";
export declare const DEBOUNCE_DELAY = 300;
export declare const getInitials: (name: string) => string;
export interface SearchConfig {
    availableMembersObservable: ko.ObservableArray<MemberData>;
    excludedMembersObservable: ko.ObservableArray<MemberData>;
    errorObservable: ko.Observable<string>;
    logContext: string;
}
export declare const performUserSearch: (searchString: string, config: SearchConfig) => Promise<void>;
export declare const createSearchInputHandler: (searchConfig: SearchConfig, timeoutRef: {
    current: ReturnType<typeof setTimeout> | undefined;
}) => (event: CustomEvent<any>) => void;
export declare const clearSearchTimeout: (timeoutRef: {
    current: ReturnType<typeof setTimeout> | undefined;
}) => void;
export declare const resetSearchState: (searchValue: ko.Observable<string>, searchRawValue: ko.Observable<string>, availableMembers: ko.ObservableArray<MemberData>, errorObservable: ko.Observable<string>) => void;
