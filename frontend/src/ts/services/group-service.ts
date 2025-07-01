import * as $ from 'jquery';
import { ConfigService } from "./config-service";

// Fetch user groups
export async function fetchUserGroups() {
    await ConfigService.loadConfig();
    const res = await fetch(`${ConfigService.getApiUrl()}/user-groups`);
    if (!res.ok) {
        throw new Error("Failed to fetch user groups");
    }
    return await res.json();
}

// Delete group using $.ajax
export const deleteGroupById = (groupId: string): Promise<void> => {
    console.log("Attempting to delete group with ID:", groupId); //
    return fetch(`${ConfigService.getApiUrl()}/user-groups/${groupId}`, { method: 'DELETE' })
        .then(async response => {
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Delete failed with status: ${response.status}, body: ${errorBody}`);
                throw new Error(`Failed to delete group. Status: ${response.status}`);
            }
            return response.json();
        });
};

// Existing createUserGroup ...
export async function createUserGroup(payload: any) { /* ... */ }

// Existing fetchApplications ...
export async function fetchApplications() { /* ... */ }
