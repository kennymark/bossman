import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_invitations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .string('invited_user_role')
        .notNullable()
        .defaultTo('normal_user')
        .index()

      // JSON array of allowed admin page keys (only used for admin teams)
      table.text('admin_pages').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('invited_user_role')
      table.dropColumn('admin_pages')
    })
  }
}

