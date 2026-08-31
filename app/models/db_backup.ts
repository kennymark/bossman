import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, computed } from '@adonisjs/lucid/orm'
import { Auditable } from '@stouder-io/adonis-auditing'
import type { DateTime } from 'luxon'

export default class DbBackup extends compose(BaseModel, Auditable) {
  @column({ isPrimary: true }) declare id: number

  @column() declare filePath: string | null

  /**
   * The size of the backup file in bytes.
   */
  @column()
  declare fileSize: number

  /**
   * The object key in the backup bucket, which is always the file's basename.
   *
   * This used to be `filePath.replace('backups/', '')`, which only produced the right
   * key because `BackupService` happened to build a *relative* path — it read
   * `app.appRoot.host`, which is `''` for a `file://` URL. Correcting that to an
   * absolute path would have left the prefix in place and silently broken download and
   * restore for every backup. Taking the basename is right for either shape.
   */
  @computed() get fileName(): string | null {
    if (!this.filePath) return null
    const segments = this.filePath.split(/[\\/]/)
    return segments[segments.length - 1] || null
  }

  /**
   * The timestamp when the backup was created.
   * This is automatically set to the current time when the record is created.
   */

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
