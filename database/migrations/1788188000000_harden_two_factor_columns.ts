import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Widens the 2FA columns so the secret can be stored encrypted and the recovery codes
 * hashed.
 *
 * `two_factor_secret` was `varchar(32)`, exactly the length of the raw base32 secret,
 * and `two_factor_recovery_codes` was `varchar(1000)` holding the codes in plaintext.
 * Both now hold values longer than their old limits.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('two_factor_secret').alter()
      table.text('two_factor_recovery_codes').alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('two_factor_secret', 32).alter()
      table.string('two_factor_recovery_codes', 1000).alter()
    })
  }
}
