import { compose } from '@adonisjs/core/helpers'
import { column } from '@adonisjs/lucid/orm'
import { Auditable } from '@stouder-io/adonis-auditing'
import type { DateTime } from 'luxon'

import { consumeJsonArray, consumeJsonObject, prepareJson } from '#utils/json_column'

import SuperBaseModel from './super_base.js'

export type PushNotificationTargetType =
  | 'all'
  | 'all_landlords'
  | 'all_tenants'
  | 'all_agencies'
  | 'specific'

export type PushNotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled'

export default class PushNotification extends compose(SuperBaseModel, Auditable) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare targetType: PushNotificationTargetType

  /**
   * Togetha database the audience belongs to (`dev` / `prod`). Scheduled sends use
   * this so they do not resolve recipients against the wrong connection.
   */
  @column()
  declare appEnv: 'dev' | 'prod'

  @column({
    prepare: prepareJson,
    consume: (value: unknown) => consumeJsonArray<string>(value),
  })
  declare targetUserIds: string[] | null

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare imageUrl: string | null

  @column()
  declare url: string | null

  @column.dateTime()
  declare scheduledAt: DateTime | null

  @column.dateTime()
  declare sentAt: DateTime | null

  @column()
  declare status: PushNotificationStatus

  @column({
    prepare: prepareJson,
    consume: consumeJsonObject,
  })
  declare oneSignalResponse: Record<string, unknown> | null

  @column()
  declare errorMessage: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
