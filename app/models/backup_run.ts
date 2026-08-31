import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export type BackupRunStatus = 'running' | 'success' | 'failed'
export type BackupRunTrigger = 'schedule' | 'manual'

/**
 * One backup attempt. Always on the `default` (admin) connection — this is the app's
 * own operational record, not customer data, and it must survive a failure against the
 * database being backed up.
 */
export default class BackupRun extends BaseModel {
  static table = 'backup_runs'

  @column({ isPrimary: true }) declare id: number

  @column() declare appEnv: 'dev' | 'prod'

  @column() declare status: BackupRunStatus

  @column() declare trigger: BackupRunTrigger

  @column() declare triggeredById: string | null

  @column() declare triggeredByEmail: string | null

  @column() declare storageKey: string | null

  @column({ consume: (value: unknown) => (value === null ? null : Number(value)) })
  declare fileSize: number | null

  @column() declare error: string | null

  @column() declare durationMs: number | null

  @column.dateTime() declare startedAt: DateTime

  @column.dateTime() declare finishedAt: DateTime | null

  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime | null
}
