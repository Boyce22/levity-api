import { Role } from '../enums/roles.enum';

export const WRITE_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MEMBER, Role.EDITOR];
export const MANAGE_ROLES: Role[] = [Role.OWNER, Role.ADMIN];
export const OWNER_ONLY: Role[] = [Role.OWNER];

export function canWrite(role: Role): boolean {
  return WRITE_ROLES.includes(role);
}

export function canManage(role: Role): boolean {
  return MANAGE_ROLES.includes(role);
}
