import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'
import type { DateTime } from 'luxon'

import Addon from './addon.js'
import Org from './org.js'

/**
 * Auditable: field-level diffs land in the admin database's `audits` table.
 *
 * Deliberately not applied to `User` or `Org` — the mixin copies every attribute into
 * the audit row, which for `User` means the password hash and the 2FA secret. Operator
 * intent for those is recorded by `recordAdminAction` instead.
 */
export default class OrgAddOn extends compose(BaseModel, Auditable) {
  @column({ isPrimary: true })
  declare id: string

  @column() declare orgId: string
  @column() declare addOnId: string
  @column() declare status: 'active' | 'cancelled' | 'expired'
  @column() declare stripeSubscriptionItemId: string
  @column() declare stripeSubscriptionId: string
  @column() declare quantity: number
  @column() declare usageConsumed: number // e.g. remaining SMS credits
  @column() declare startsAt: DateTime
  @column() declare endsAt: DateTime
  @column() declare metadata: ModelObject
  @belongsTo(() => Org) declare org: BelongsTo<typeof Org>
  @belongsTo(() => Addon) declare addOn: BelongsTo<typeof Addon>
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
