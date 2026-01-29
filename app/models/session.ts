import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import SuperBaseModel from './super_base.js'
import User from './user.js'

export default class Session extends SuperBaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare ipAddress: string | null

  @column()
  declare userAgent: string | null

  @column()
  declare deviceType: string | null // mobile, desktop, tablet

  @column()
  declare browser: string | null

  @column()
  declare os: string | null

  @column()
  declare location: string | null

  @column()
  declare isCurrent: boolean

  @column.dateTime({
    prepare: (value: DateTime | string | Date | null) => {
      if (!value) return null
      if (value instanceof DateTime) return value.toSQL()
      if (value instanceof Date) return DateTime.fromJSDate(value).toSQL()
      if (typeof value === 'string') return value
      return null
    },
    consume: (value: string | number | null): DateTime | null => {
      if (!value) return null
      if (typeof value === 'number') {
        // Handle Unix timestamp (seconds or milliseconds)
        const timestamp = value > 1000000000000 ? value : value * 1000
        return DateTime.fromMillis(timestamp)
      }
      if (typeof value === 'string') {
        return DateTime.fromSQL(value) || DateTime.fromISO(value) || null
      }
      return null
    },
  })
  declare lastActivity: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
