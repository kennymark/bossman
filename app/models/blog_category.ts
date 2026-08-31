import { compose } from '@adonisjs/core/helpers'
import { column } from '@adonisjs/lucid/orm'
import { Auditable } from '@stouder-io/adonis-auditing'
import type { DateTime } from 'luxon'

import SuperBaseModel from './super_base.js'

/**
 * Auditable: field-level diffs land in the admin database's `audits` table.
 *
 * Deliberately not applied to `User` or `Org` — the mixin copies every attribute into
 * the audit row, which for `User` means the password hash and the 2FA secret. Operator
 * intent for those is recorded by `recordAdminAction` instead.
 */
export default class BlogCategory extends compose(SuperBaseModel, Auditable) {
  static table = 'blog_categories'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
