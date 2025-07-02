import { ConfigService } from "./config-service";

export async function fetchUserGroups() {
  
  await ConfigService.loadConfig();
  const res = await fetch(`${ConfigService.getApiUrl()}/user-groups`);

  if (!res.ok) {
    throw new Error("Failed to fetch user groups");
  }

  return await res.json();
}

// Create user group
export async function createUserGroup(payload: any): Promise<any> {
    await ConfigService.loadConfig();
    const res = await fetch(`${ConfigService.getApiUrl()}/user-groups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
        const errorBody = await res.text();
        console.error(`Create group failed with status: ${res.status}, body: ${errorBody}`);
        throw new Error(`Failed to create group. Status: ${res.status}`);
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

// Existing fetchApplications ...
export async function fetchApplications() { /* ... */ }
