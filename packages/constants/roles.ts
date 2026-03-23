export enum ROLES {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  SUPERADMIN = 'superadmin',
}

export const ROLE_HIERARCHY: Record<ROLES, number> = {
  [ROLES.SUPERADMIN]: 100,
  [ROLES.OWNER]: 30,
  [ROLES.ADMIN]: 20,
  [ROLES.MEMBER]: 10,
};

export function hasRolePermission(userRole: ROLES, requiredRole: ROLES): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
