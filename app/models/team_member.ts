import { compose } from '@adonisjs/core/helpers'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'
import type { DateTime } from 'luxon'

import SuperBaseModel from './super_base.js'
import User from './user.js'

export type TeamRole = 'owner' | 'admin' | 'member'

export default class TeamMember extends compose(SuperBaseModel, Auditable) {
  static table = 'team_members'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare role: TeamRole

  @column()
  declare enableProdAccess: boolean

  /** Optional expiry on the production grant; null means it does not lapse. */
  @column.dateTime({ columnName: 'prod_access_expires_at', serializeAs: 'prodAccessExpiresAt' })
  declare prodAccessExpiresAt: DateTime | null

  /** `read` = may look at production but not change it. Edited on the member page. */
  @column({ columnName: 'prod_access_mode', serializeAs: 'prodAccessMode' })
  declare prodAccessMode: 'read' | 'write'

  /** Data access: 'all' = full access; 'selected' = only allowed properties/leases (legacy, prefer per-resource modes). */
  @column()
  declare dataAccessMode: 'all' | 'selected'

  /** Properties access: 'all' or 'selected'. When 'selected', only allowedLeaseableEntityIds are visible. */
  @column()
  declare propertiesAccessMode: 'all' | 'selected'

  /** Leases access: 'all' or 'selected'. When 'selected', only allowedLeaseIds are visible. */
  @column()
  declare leasesAccessMode: 'all' | 'selected'

  /** When propertiesAccessMode is 'selected', only these property (leaseable entity) IDs are visible. */
  @column({
    columnName: 'allowed_leaseable_entity_ids',
    prepare: (value: string[] | null) => (Array.isArray(value) ? JSON.stringify(value) : null),
    consume: (value: unknown) => {
      if (value == null) return null
      if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) return null
          return parsed.filter((v): v is string => typeof v === 'string')
        } catch {
          return null
        }
      }
      return null
    },
  })
  declare allowedLeaseableEntityIds: string[] | null

  /** Optional: after this time, access to properties and leases is treated as expired (member sees none). */
  @column.dateTime({ columnName: 'data_access_expires_at', serializeAs: 'dataAccessExpiresAt' })
  declare dataAccessExpiresAt: DateTime | null

  /** When leasesAccessMode is 'selected', only these lease IDs are visible. */
  @column({
    columnName: 'allowed_lease_ids',
    prepare: (value: string[] | null) => (Array.isArray(value) ? JSON.stringify(value) : null),
    consume: (value: unknown) => {
      if (value == null) return null
      if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) return null
          return parsed.filter((v): v is string => typeof v === 'string')
        } catch {
          return null
        }
      }
      return null
    },
  })
  declare allowedLeaseIds: string[] | null

  /**
   * Allowed admin page keys for this member.
   * Stored as JSON in DB column allowed_pages.
   */
  @column({
    columnName: 'allowed_pages',
    prepare: (value: string[] | null) => (Array.isArray(value) ? JSON.stringify(value) : null),
    consume: (value: unknown) => {
      if (value == null) return null
      if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (!Array.isArray(parsed)) return null
          return parsed.filter((v): v is string => typeof v === 'string')
        } catch {
          return null
        }
      }
      return null
    },
  })
  declare allowedPages: string[] | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
