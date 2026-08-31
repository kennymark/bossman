import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Time-boxes production database access.
 *
 * `team_members.data_access_expires_at` already limited which properties and leases a
 * member could see, but `enable_prod_access` — the flag that decides whether they read
 * the live customer database at all — was permanent once granted. Access to production
 * should be something you are given for a reason and lose again.
 *
 * Null means "no expiry", which is what every existing grant becomes, so this is not a
 * behaviour change for anyone already holding access.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.timestamp('prod_access_expires_at').nullable()
      /** Why the grant was made — read back on the team member page and in audits. */
      table.string('prod_access_reason', 500).nullable()
      table.string('prod_access_granted_by').nullable()
      table.timestamp('prod_access_granted_at').nullable()
    })

    this.schema.alterTable('team_members', (table) => {
      table.timestamp('prod_access_expires_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('prod_access_expires_at')
      table.dropColumn('prod_access_reason')
      table.dropColumn('prod_access_granted_by')
      table.dropColumn('prod_access_granted_at')
    })

    this.schema.alterTable('team_members', (table) => {
      table.dropColumn('prod_access_expires_at')
    })
  }
}
