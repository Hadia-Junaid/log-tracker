export type Application = {
  _id: string;
  name: string;
  hostname: string;
  createdAt: string;
  isActive: boolean;
  environment: string;
  description?: string;
};

export type UserGroup = {
  _id: string;
  name: string;
  is_admin: boolean;
}