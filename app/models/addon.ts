import { compose } from '@adonisjs/core/helpers'
import { slugify } from '@adonisjs/lucid-slugify'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { Auditable } from '@stouder-io/adonis-auditing'
import type { DateTime } from 'luxon'

import { consumeJsonArray, prepareJson } from '#utils/json_column'

/**
 * Auditable: field-level diffs land in the admin database's `audits` table.
 *
 * Deliberately not applied to `User` or `Org` — the mixin copies every attribute into
 * the audit row, which for `User` means the password hash and the 2FA secret. Operator
 * intent for those is recorded by `recordAdminAction` instead.
 */
export default class Addon extends compose(BaseModel, Auditable) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  @slugify({ strategy: 'dbIncrement', fields: ['name'] })
  declare slug: string

  @column()
  declare shortDescription: string | null

  @column()
  declare longDescription: string | null

  @column()
  declare priceAmount: string | null

  @column()
  declare priceCurrency: string | null

  @column()
  declare billingType: 'one_off' | 'recurring_monthly' | 'recurring_yearly' | 'usage'

  @column()
  declare stripePriceId: string | null

  @column({
    prepare: prepareJson,
    /**
     * The consume was previously commented out to dodge the double-parse crash. The
     * helper handles both an already-parsed json column and a JSON string, so the
     * column no longer depends on which of the two the driver returns.
     */
    consume: (value: unknown) => consumeJsonArray<string>(value),
  })
  declare features: string[] | null

  @column()
  declare isActive: boolean

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
