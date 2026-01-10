import type { UserRole } from '@/types'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  editor: 3,
  contributor: 2,
  viewer: 1,
}

export function canManageMembers(role: UserRole): boolean {
  return role === 'owner' || role === 'admin'
}

export function canEdit(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.editor
}

export function canContribute(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.contributor
}

export function canDelete(role: UserRole): boolean {
  return role === 'owner' || role === 'admin'
}

export function canChangeRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
  // Can only assign roles lower than your own
  return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetRole]
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'owner':
      return 'Owner'
    case 'admin':
      return 'Admin'
    case 'editor':
      return 'Editor'
    case 'contributor':
      return 'Contributor'
    case 'viewer':
      return 'Viewer'
  }
}

export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'owner':
      return 'Full control, billing, exports, can delete workspace'
    case 'admin':
      return 'Manage members, roles, can revert changes'
    case 'editor':
      return 'Add and edit people, events, sources'
    case 'contributor':
      return 'Can add new items, edits need approval'
    case 'viewer':
      return 'Read-only access'
  }
}

export const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'editor', 'contributor', 'viewer']
