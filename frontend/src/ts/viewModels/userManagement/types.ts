export interface MemberData {
    id: number | string;
    email: string;
    name: string;
    initials: string;
}

export interface GroupData {
    groupId: string;
    groupName: string;
    description?: string;
    memberCount: number;
    createdDate?: string;
    createdAgo?: string;
}

import * as ko from "knockout";
export interface ApplicationOption {
    name: string;
    checked: ko.Observable<boolean>;
} 