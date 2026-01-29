import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('two_factor_enabled').defaultTo(false)
      table.string('two_factor_secret', 32).nullable()
      table.string('two_factor_recovery_codes', 1000).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('two_factor_enabled')
      table.dropColumn('two_factor_secret')
      table.dropColumn('two_factor_recovery_codes')
    })
  }
}
