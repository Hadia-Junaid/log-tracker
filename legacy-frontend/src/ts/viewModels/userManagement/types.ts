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
    is_admin?: boolean;
    members?: string[];
    assigned_applications?: string[];
}

import * as ko from "knockout";
export interface ApplicationOption {
    id: string;
    name: string;
    checked: ko.Observable<boolean>;
} 