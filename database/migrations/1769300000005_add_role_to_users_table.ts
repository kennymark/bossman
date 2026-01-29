import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const hasRole = await this.schema.hasColumn(this.tableName, 'role')
    if (hasRole) return

    this.schema.alterTable(this.tableName, (table) => {
      table.string('role').notNullable().defaultTo('normal_user')
    })
  }

  async down() {
    const hasRole = await this.schema.hasColumn(this.tableName, 'role')
    if (!hasRole) return

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role')
    })
  }
}

