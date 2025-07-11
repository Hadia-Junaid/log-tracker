export declare function fetchUserGroups(): Promise<any>;
export declare function createUserGroup(payload: any): Promise<any>;
export declare const deleteGroupById: (groupId: string) => Promise<void>;
export declare function updateUserGroup(groupId: string, payload: any): Promise<any>;
export declare function fetchApplications(): Promise<string[]>;
export declare function fetchApplicationsWithIds(): Promise<{
    id: string;
    name: string;
}[]>;
export declare function fetchGroupById(groupId: string): Promise<any>;
export declare function assignApplicationToGroup(groupId: string, applicationId: string): Promise<void>;
