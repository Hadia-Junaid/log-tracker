import { ConfigService } from "./config-service";

export async function fetchUserGroups() {
  
  await ConfigService.loadConfig();
  const res = await fetch(`${ConfigService.getApiUrl()}/user-groups`);

  if (!res.ok) {
    throw new Error("Failed to fetch user groups");
  }

  return await res.json();
}

// Existing createUserGroup ...
export async function createUserGroup(payload: any) { /* ... */ }

// Existing fetchApplications ...
export async function fetchApplications() { /* ... */ }
