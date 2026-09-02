import { BaseTransformer } from '@adonisjs/core/transformers'

import type User from '#models/user'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'fullName',
      'email',
      'isGodAdmin',
      'role',
      'isAdminOrSuperAdmin',
      'enableProdAccess',
      'prodAccessMode',
      'pendingEmail',
      'avatar',
      'emailVerified',
      'emailVerifiedAt',
      'settings',
      'twoFactorEnabled',
      'lastLoginAt',
      'createdAt',
      'updatedAt',
    ])
  }
}
