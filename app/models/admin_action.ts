import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

import { consumeJsonObject, prepareJson } from '#utils/json_column'

export type AdminActionOutcome = 'success' | 'failed'

/**
 * One operator action. Always on the `default` (admin) connection — see the migration
 * for why this exists alongside `audits`.
 */
export default class AdminAction extends BaseModel {
  static table = 'admin_actions'

  @column({ isPrimary: true }) declare id: number

  @column() declare actorId: string | null
  @column() declare actorEmail: string | null
  @column() declare actorRole: string | null

  @column() declare action: string

  @column() declare appEnv: 'dev' | 'prod' | null

  @column() declare targetType: string | null
  @column() declare targetId: string | null
  @column() declare targetLabel: string | null

  @column() declare reason: string | null

  @column() declare outcome: AdminActionOutcome
  @column() declare error: string | null

  @column({ prepare: prepareJson, consume: consumeJsonObject })
  declare metadata: Record<string, unknown> | null

  @column() declare ipAddress: string | null
  @column() declare userAgent: string | null

  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime | null
}
