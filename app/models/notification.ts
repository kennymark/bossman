import type { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import type User from './user.js'
import SuperBaseModel from './super_base.js'

export interface NotificationAction {
  label: string
  url?: string
  action?: string
  variant?: 'default' | 'destructive' | 'outline'
}

export default class Notification extends SuperBaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare type: 'info' | 'success' | 'warning' | 'error'

  @column()
  declare read: boolean

  @column.dateTime()
  declare readAt: DateTime | null

  @column({
    prepare: (value: NotificationAction[] | null) =>
      value ? JSON.stringify(value) : null,
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare actions: NotificationAction[] | null

  @column({
    prepare: (value: Record<string, unknown> | null) =>
      value ? JSON.stringify(value) : null,
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare data: Record<string, unknown> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relations
  @column()
  declare user?: User
}