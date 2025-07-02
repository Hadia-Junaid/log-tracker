import { ConfigService } from "./config-service";

export async function fetchUserGroups() {
  
  await ConfigService.loadConfig();
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${ConfigService.getApiUrl()}/user-groups`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user groups");
  }

  return await res.json();
}

// Create user group
export async function createUserGroup(payload: any): Promise<any> {
    await ConfigService.loadConfig();
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${ConfigService.getApiUrl()}/user-groups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
    const token = localStorage.getItem('authToken');
    console.log("Attempting to delete group with ID:", groupId); //
    return fetch(`${ConfigService.getApiUrl()}/user-groups/${groupId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        .then(async response => {
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Delete failed with status: ${response.status}, body: ${errorBody}`);
                throw new Error(`Failed to delete group. Status: ${response.status}`);
            }
            return response.json();
        });
};

// Update user group
export async function updateUserGroup(groupId: string, payload: any): Promise<any> {
  await ConfigService.loadConfig();
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${ConfigService.getApiUrl()}/user-groups/${groupId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Update group failed with status: ${res.status}, body: ${errorBody}`);
    throw new Error(`Failed to update group. Status: ${res.status}`);
  }

  return await res.json();
}

// Fetch applications from the API
export async function fetchApplications(): Promise<string[]> {
    await ConfigService.loadConfig();
    const res = await fetch(`${ConfigService.getApiUrl()}/applications`);
    
    if (!res.ok) {
        throw new Error("Failed to fetch applications");
    }
    
    const response = await res.json();
    // Extract application names from the data array
    return response.data.map((app: any) => app.name);
}

// Fetch full application objects with IDs
export async function fetchApplicationsWithIds(): Promise<{id: string, name: string}[]> {
    await ConfigService.loadConfig();
    const res = await fetch(`${ConfigService.getApiUrl()}/applications`);
    
    if (!res.ok) {
        throw new Error("Failed to fetch applications");
    }
    
    const response = await res.json();
    // Return full application objects with id and name
    return response.data.map((app: any) => ({
        id: app._id,
        name: app.name
    }));
}
