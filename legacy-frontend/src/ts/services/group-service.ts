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

// Delete group
export const deleteGroupById = (groupId: string): Promise<void> => {
    const token = localStorage.getItem('authToken');
    return fetch(`${ConfigService.getApiUrl()}/user-groups/${groupId}`, { 
        method: 'DELETE', 
        headers: { 
            'Authorization': `Bearer ${token}` 
        } 
    })
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
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${ConfigService.getApiUrl()}/applications`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch applications. Status: ${res.status}`);
    }
    
    const response = await res.json();
    // Return full application objects with id and name
    return response.data.map((app: any) => ({
        id: app._id,
        name: app.name
    }));
}

// Fetch group details by ID
export async function fetchGroupById(groupId: string): Promise<any> {
    await ConfigService.loadConfig();
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${ConfigService.getApiUrl()}/user-groups/${groupId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch group details. Status: ${res.status}`);
    }
    
    return await res.json();
}

// Assign application to group
export async function assignApplicationToGroup(groupId: string, applicationId: string): Promise<void> {
    await ConfigService.loadConfig();
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${ConfigService.getApiUrl()}/user-groups/${groupId}/assign-application`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId })
    });
    
    if (!res.ok) {
        const errorBody = await res.text();
        console.error(`Assign application failed with status: ${res.status}, body: ${errorBody}`);
        throw new Error(`Failed to assign application to group. Status: ${res.status}`);
    }
}
