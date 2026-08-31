import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Every backup attempt, successful or not.
 *
 * `db_backups` lives in the customer databases and only ever holds rows for backups
 * that completed, so a failed run left no trace anywhere — and `createBackup` used to
 * swallow the error, so the UI reported success regardless. This table lives in the
 * admin database, records the attempt before the dump starts, and is what the backup
 * health panel reads.
 */
export default class extends BaseSchema {
  protected tableName = 'backup_runs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      /** Which application database was dumped. */
      table.string('app_env', 16).notNullable()

      /** 'running' | 'success' | 'failed' */
      table.string('status', 16).notNullable().defaultTo('running')

      /** How the run was started: 'schedule' | 'manual'. */
      table.string('trigger', 16).notNullable().defaultTo('schedule')

      /** Admin user who pressed the button, when there was one. */
      table.string('triggered_by_id').nullable()
      table.string('triggered_by_email').nullable()

      /** Object key in the backup bucket, set once the upload lands. */
      table.string('storage_key').nullable()
      table.bigInteger('file_size').nullable()

      /** Truncated failure message; the full error goes to the logger. */
      table.text('error').nullable()

      table.integer('duration_ms').nullable()

      table.timestamp('started_at').notNullable()
      table.timestamp('finished_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['app_env', 'started_at'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
