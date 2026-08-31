import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Operator action log.
 *
 * `audits` (from adonis-auditing) records field diffs for the handful of models that
 * opt in, scoped per user and with no idea which database the change landed in. It
 * cannot answer the question this console actually needs answered: who banned that
 * customer, against production, and why.
 *
 * This table records intent — actor, action, target, environment, reason, outcome —
 * and always lives in the admin database, so it survives whatever happened to the
 * database being operated on.
 */
export default class extends BaseSchema {
  protected tableName = 'admin_actions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      /** Denormalised on purpose: the log must stay readable if the user is deleted. */
      table.string('actor_id').nullable()
      table.string('actor_email').nullable()
      table.string('actor_role', 32).nullable()

      /** Dotted action key, e.g. `org.ban`, `backup.restore`, `member.update`. */
      table.string('action', 64).notNullable()

      /** Which application database the action touched. */
      table.string('app_env', 16).nullable()

      table.string('target_type', 64).nullable()
      table.string('target_id').nullable()
      /** Human label captured at the time, so the log reads without a join. */
      table.string('target_label').nullable()

      /** Operator-supplied justification from the confirmation step. */
      table.text('reason').nullable()

      /** 'success' | 'failed' */
      table.string('outcome', 16).notNullable().defaultTo('success')
      table.text('error').nullable()

      /** Dry-run summary, affected counts, before/after flags. Never secrets. */
      table.jsonb('metadata').nullable()

      table.string('ip_address', 64).nullable()
      table.text('user_agent').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')

      table.index(['created_at'])
      table.index(['actor_id', 'created_at'])
      table.index(['action', 'created_at'])
      table.index(['app_env', 'created_at'])
      table.index(['target_type', 'target_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
