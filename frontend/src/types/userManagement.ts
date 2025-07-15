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
  is_active?: boolean;
  members?: string[];
  assigned_applications?: {
    _id: string;
    name: string;
    isActive: boolean;
  }[];
  super_admin_emails?: string[];
}

export interface ApplicationOption {
  id: string;
  name: string;
  checked: boolean;
  isActive: boolean;
}

export interface CreateGroupPayload {
  name: string;
  members?: { name: string; email: string }[];
  assigned_applications: string[];
  is_admin?: boolean;
}

export interface UpdateGroupPayload {
  name?: string;
  members?: { name: string; email: string }[];
  assigned_applications?: string[];
  is_admin?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
} 