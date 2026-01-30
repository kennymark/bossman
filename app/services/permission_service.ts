import logger from '@adonisjs/core/services/logger'
import type TogethaUser from '#models/togetha_user'

export type Pages = 'dashboard' | 'team' | 'finance' | 'manage' | 'settings'
export const AccountRoles = ['god_admin', 'super_admin', 'admin', 'external', 'other']

export interface PageConfig {
  name: string
  enabled: boolean
  permissions: {
    canView?: boolean
    canEdit?: boolean
    canInviteUser?: boolean
    canDeleteUser?: boolean
  }
}

const defaultToggles = {
  canEdit: true,
  canDelete: true,
  canCreate: true,
  canView: true,
}

const fullAccessPermission = {
  canView: true,
  canEdit: true,
  canDelete: true,
  canCreate: true,
}

export const defaultPermisions = {
  god_admin: {
    ...fullAccessPermission,
  },
  super_admin: {
    ...fullAccessPermission,
  },
  admin: {
    ...fullAccessPermission,
  },
  external: {
    canView: true,
  },
  other: {
    canView: true,
  },
}

const togethaDefaultPermisions = {
  owner: {
    ...defaultToggles,
    canInviteUsers: true,
    entitiesAllowed: 'all',
  },
  team_admin: {
    ...defaultToggles,
    canInviteUsers: true,
  },
  viewer: {
    canMakeChanges: false,
    canView: true,
    canEdit: false,
  },
  tenant: {
    canMakeChanges: true,
  },
}

class PermissionService {
  static async assignTogethaPermissions(user: TogethaUser) {
    logger.info('PermissionService: Assigning permissions')
    if (user.landlordId) {
      user.permissions = togethaDefaultPermisions.owner
    }
    if (user.agencyId) {
      user.permissions = togethaDefaultPermisions.owner
    }
    if (user.role === 'team_admin') {
      user.permissions = togethaDefaultPermisions.team_admin
    }
    if (user.role === 'viewer') {
      user.permissions = togethaDefaultPermisions.viewer
    }
    if (user.tenantId) {
      user.permissions = togethaDefaultPermisions.tenant
    }

    logger.info('PermissionService: Done assigning permission')
  }
}

export default PermissionService
