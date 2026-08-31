import { compose } from '@adonisjs/core/helpers'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'
import type { DateTime } from 'luxon'

import Org from './org.js'
import SuperBaseModel from './super_base.js'

/**
 * Auditable: field-level diffs land in the admin database's `audits` table.
 *
 * Deliberately not applied to `User` or `Org` — the mixin copies every attribute into
 * the audit row, which for `User` means the password hash and the 2FA secret. Operator
 * intent for those is recorded by `recordAdminAction` instead.
 */
export default class DeleteAccountRequest extends compose(SuperBaseModel, Auditable) {
  @column()
  declare orgId: string

  @column()
  declare isSuccessful: boolean

  @column({ serializeAs: null })
  declare tokenHash: string

  @column.dateTime()
  declare expiresAt: DateTime

  @belongsTo(() => Org)
  declare org: BelongsTo<typeof Org>
}
