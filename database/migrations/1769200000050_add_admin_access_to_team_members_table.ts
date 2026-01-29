import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_members'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // JSON array of allowed admin page keys (only used for admin teams)
      table.text('admin_pages').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('admin_pages')
    })
  }
}

