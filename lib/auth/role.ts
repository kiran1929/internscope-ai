import { UserRole, Permission, RolePermissions } from '@/types/auth';

export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.USER]: [
    'view:dashboard',
    'manage:applications',
    'view:analytics',
    'manage:settings',
  ],
  [UserRole.ADMIN]: [
    'view:dashboard',
    'manage:applications',
    'manage:companies',
    'view:analytics',
    'manage:settings',
    'admin:system',
  ],
  [UserRole.SUPER_ADMIN]: [
    'view:dashboard',
    'manage:applications',
    'manage:companies',
    'view:analytics',
    'manage:settings',
    'admin:system',
    'admin:users',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if a user's role satisfies a required role level.
 * Hierarchy: SUPER_ADMIN > ADMIN > USER
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === requiredRole) return true;
  
  if (userRole === UserRole.SUPER_ADMIN) return true;
  if (userRole === UserRole.ADMIN && requiredRole === UserRole.USER) return true;
  
  return false;
}
