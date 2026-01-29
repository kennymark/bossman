import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.rawQuery('(lower(hex(randomblob(16))))').knexQuery)
      table.string('full_name').nullable()
      table.string('email').notNullable().unique()
      table.string('password').nullable()
      table.string('role').notNullable().defaultTo('normal_user')
      table.json('avatar').nullable()
      table.json('google_data').nullable()
      table.string('token').nullable()
      table.string('pending_email').nullable()
      table.string('email_change_token', 32).nullable()
      table.json('settings').nullable()
      table.timestamp('last_login_at')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
