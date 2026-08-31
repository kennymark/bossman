import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import { Auditable } from '@stouder-io/adonis-auditing'
import type { DateTime } from 'luxon'

/**
 * Auditable: field-level diffs land in the admin database's `audits` table.
 *
 * Deliberately not applied to `User` or `Org` — the mixin copies every attribute into
 * the audit row, which for `User` means the password hash and the 2FA secret. Operator
 * intent for those is recorded by `recordAdminAction` instead.
 */
export default class AccountBan extends compose(BaseModel, Auditable) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare orgId: string

  @column()
  declare userId: string

  @column()
  declare reason: string

  @column()
  declare isBanActive: boolean

  @column()
  declare metadata: ModelObject

  @column()
  declare removedAt: DateTime | null

  @column()
  declare banStartsAt: DateTime

  @column()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
