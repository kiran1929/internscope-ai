export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export type Permission = 
  | 'view:dashboard'
  | 'manage:applications'
  | 'manage:companies'
  | 'view:analytics'
  | 'manage:settings'
  | 'admin:system'
  | 'admin:users';

export interface RolePermissions {
  [UserRole.USER]: Permission[];
  [UserRole.ADMIN]: Permission[];
  [UserRole.SUPER_ADMIN]: Permission[];
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
