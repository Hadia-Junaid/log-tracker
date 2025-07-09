import axios from '../api/axios';
import { CreateGroupPayload, UpdateGroupPayload, GroupData, ApplicationOption, MemberData } from '../types/userManagement';

export const userGroupService = {
  // Fetch all user groups with pagination
  async fetchUserGroups(page: number = 1, pageSize: number = 8, search: string = ""): Promise<{ data: GroupData[], total: number }> {
    const response = await axios.get('/user-groups', {
      params: {
        page,
        pageSize,
        search,
      },
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
      members: group.members?.map((member: any) => member.email) || [],
      assigned_applications: group.assigned_applications?.map((app: any) => app.name) || []
    }));
    
    return {
      data: groups,
      total: response.data.total
    };
  },

  // Create a new user group
  async createUserGroup(payload: CreateGroupPayload): Promise<GroupData> {
    const response = await axios.post('/user-groups', payload);
    return response.data;
  },

  // Update a user group
  async updateUserGroup(groupId: string, payload: UpdateGroupPayload): Promise<GroupData> {
    const response = await axios.patch(`/user-groups/${groupId}`, payload);
    return response.data;
  },

  // Delete a user group
  async deleteUserGroup(groupId: string): Promise<void> {
    await axios.delete(`/user-groups/${groupId}`);
  },

  // Fetch group details by ID
  async fetchGroupById(groupId: string): Promise<GroupData> {
    const response = await axios.get(`/user-groups/${groupId}`);
    return response.data;
  },

  // Fetch applications
  async fetchApplications(): Promise<ApplicationOption[]> {
    const response = await axios.get('/applications');
    return response.data.data.map((app: any) => ({
      id: app._id,
      name: app.name,
      checked: false
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

  // New: Paginated user search for better performance
  async searchUsersPaginated(query: string, page: number = 1, pageSize: number = 50): Promise<{ users: MemberData[], hasMore: boolean }> {
    const searchParam = query === '' ? 'searchString=""' : `searchString=${encodeURIComponent(query)}`;
    const response = await axios.get(`/admin/users/search?${searchParam}&page=${page}&pageSize=${pageSize}`);
    
    return {
      users: response.data.users?.map((user: any) => ({
        id: user.id || user.email,
        email: user.email,
        name: user.name,
        initials: getInitials(user.name)
      })) || response.data.map((user: any) => ({
        id: user.id || user.email,
        email: user.email,
        name: user.name,
        initials: getInitials(user.name)
      })),
      hasMore: response.data.hasMore || false
    };
  },

  // Assign application to user group
  async assignApplication(groupId: string, applicationId: string): Promise<void> {
    await axios.patch(`/user-groups/${groupId}/assign-application`, {
      applicationId: applicationId
    });
  },

  // Unassign application from user group
  async unassignApplication(groupId: string, applicationId: string): Promise<void> {
    await axios.delete(`/user-groups/${groupId}/unassign-application`, {
      data: { applicationId: applicationId }
    });
  }
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