import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Adds a read-only tier to production access.
 *
 * `enable_prod_access` decides whether a member reads the live customer database at
 * all; `prod_access_mode` decides whether they may also change it. Existing grants
 * default to `write`, which is what they were before this column existed, so nobody
 * loses an ability they already had.
 *
 * Stored on both records for the same reason the expiry is: the middleware reads the
 * user, the team page edits the member, and the effective mode is the stricter of the
 * two.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('prod_access_mode', 16).notNullable().defaultTo('write')
    })

    this.schema.alterTable('team_members', (table) => {
      table.string('prod_access_mode', 16).notNullable().defaultTo('write')
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('prod_access_mode')
    })

    this.schema.alterTable('team_members', (table) => {
      table.dropColumn('prod_access_mode')
    })
  }
}
