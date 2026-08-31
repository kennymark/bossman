import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { column, computed, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { type Attachment, attachment } from '@jrmc/adonis-attachment'
import type { DateTime } from 'luxon'

import { consumeJsonObject, prepareJson } from '#utils/json_column'

import Session from './session.js'
import SuperBaseModel from './super_base.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(SuperBaseModel, AuthFinder) {
  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30d',
  })
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare isGodAdmin: boolean

  @column()
  declare role: 'super_admin' | 'admin' | 'normal_user'

  /** When false, user is restricted to dev DB; sidebar hides environment switcher. Synced from team member when applicable. */
  @column({ columnName: 'enable_prod_access', serializeAs: 'enableProdAccess' })
  declare enableProdAccess: boolean

  /**
   * When the production grant lapses. Null means it does not.
   *
   * `resolveAppEnv` treats an expired grant as no grant, so a lapsed member silently
   * drops back to the dev database rather than keeping production access forever.
   */
  @column.dateTime({ columnName: 'prod_access_expires_at', serializeAs: 'prodAccessExpiresAt' })
  declare prodAccessExpiresAt: DateTime | null

  /** Why production access was granted, captured at grant time. */
  @column({ columnName: 'prod_access_reason', serializeAs: 'prodAccessReason' })
  declare prodAccessReason: string | null

  @column({ columnName: 'prod_access_granted_by', serializeAs: 'prodAccessGrantedBy' })
  declare prodAccessGrantedBy: string | null

  @column.dateTime({ columnName: 'prod_access_granted_at', serializeAs: 'prodAccessGrantedAt' })
  declare prodAccessGrantedAt: DateTime | null

  @computed()
  public get isAdminOrSuperAdmin() {
    return this.role === 'admin' || this.role === 'super_admin'
  }

  @column()
  declare pendingEmail: string | null

  @column({ serializeAs: null })
  declare emailChangeToken: string | null

  @attachment({ preComputeUrl: true })
  declare avatar: Attachment | null

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare emailVerified: boolean

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column({ serializeAs: null })
  declare token: string | null

  @column({
    prepare: prepareJson,
    consume: consumeJsonObject,
  })
  declare settings: Record<string, unknown> | null

  @column()
  declare twoFactorEnabled: boolean

  @column({ serializeAs: null })
  declare twoFactorSecret: string | null

  @column({ serializeAs: null })
  declare twoFactorRecoveryCodes: string | null

  @column.dateTime()
  declare lastLoginAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Session)
  declare sessions: HasMany<typeof Session>
}
