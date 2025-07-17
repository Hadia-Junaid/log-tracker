import axios from '../api/axios';
import { CreateGroupPayload, UpdateGroupPayload, GroupData, ApplicationOption, MemberData } from '../types/userManagement';

interface GroupDetailsResponse {
  _id: string;
  name: string;
  description?: string;
  is_admin: boolean;
  is_active?: boolean;
  super_admin_emails?: string[];
  members: Array<{
    _id: string;
    email: string;
    name: string;
  }>;
  assigned_applications: Array<{
    _id: string;
    name: string;
  }>;
  createdAt?: string;
}

export const userGroupService = {
  // Fetch all user groups with pagination
  async fetchUserGroups(page: number = 1, pageSize: number = 8, search: string = "", is_active?: boolean): Promise<{ data: GroupData[], total: number }> {
    const params: any = {
      page,
      pageSize,
      search,
    };
    
    // Only add is_active parameter if it's explicitly true or false (not undefined)
    if (is_active !== undefined) {
      params.is_active = is_active;
    }
    
    const response = await axios.get('/user-groups', {
      params,
    });

    //if server returns 500 error, send data as empty array
    if (response.status === 500) {
      return {
        data: [],
        total: 0
      };
    }
    
    const groups = response.data.data.map((group: any) => ({
      groupId: group._id,
      groupName: group.name,
      description: group.description,
      memberCount: group.members?.length || 0,
      createdDate: group.createdAt,
      createdAgo: getRelativeTime(new Date(group.createdAt)),
      is_admin: group.is_admin,
      is_active: group.is_active,
      members: group.members?.map((member: any) => member.email) || [],
      assigned_applications: group.assigned_applications?.map((app: any) => ({
        _id: app._id,
        name: app.name,
        isActive: app.isActive
      })) || []
    }));
    
    return {
      data: groups,
      total: response.data.total
    };
  },

  // Create a new user group
  async createUserGroup(payload: CreateGroupPayload): Promise<GroupData> {
    try {
      const response = await axios.post('/user-groups', payload);
      return response.data;
    } catch (error: any) {
      // Re-throw the error for the component to handle, but don't log validation errors
      if (error.response?.status === 400) {
        throw error; // Validation errors are expected, just re-throw
      }
      // Log unexpected errors
      console.error('Unexpected error creating user group:', error);
      throw error;
    }
  },

  // Update a user group
  async updateUserGroup(groupId: string, payload: UpdateGroupPayload): Promise<GroupData> {
    try {
      const response = await axios.patch(`/user-groups/${groupId}`, payload);
      return response.data;
    } catch (error: any) {
      // Re-throw the error for the component to handle, but don't log validation errors
      if (error.response?.status === 400) {
        throw error; // Validation errors are expected, just re-throw
      }
      // Log unexpected errors
      console.error('Unexpected error updating user group:', error);
      throw error;
    }
  },

  // Delete a user group
  async deleteUserGroup(groupId: string): Promise<void> {
    await axios.delete(`/user-groups/${groupId}`);
  },

  // Fetch group by ID
  async fetchGroupById(groupId: string): Promise<GroupDetailsResponse> {
    const response = await axios.get(`/user-groups/${groupId}`);
    return response.data;
  },

  // Fetch applications
  async fetchApplications(): Promise<ApplicationOption[]> {
    const response = await axios.get('/applications', {
      params: {
        allPages: true // Request a large number to get all applications
      }
    });
    return response.data.data.map((app: any) => ({
      id: app._id,
      name: app.name,
      checked: false,
      isActive: app.isActive
    }));
  },

  // Search users in directory
  async searchUsers(query: string): Promise<MemberData[]> {
    // Use correct param and value for backend
    const param = query === '' ? 'searchString=""' : `searchString=${encodeURIComponent(query)}`;
    const response = await axios.get(`/admin/users/search?${param}`);
    return response.data.map((user: any) => ({
      id: user.id || user.email,
      email: user.email,
      name: user.name,
      initials: getInitials(user.name)
    }));
  },
};

// Utility functions
function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  for (const [unit, val] of Object.entries(intervals)) {
    const count = Math.floor(seconds / val);
    if (count > 0) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}