import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.rawQuery('(lower(hex(randomblob(16))))').knexQuery)

      table.uuid('team_id').notNullable().index()
      table.uuid('user_id').notNullable().index()
      table.string('role').notNullable().defaultTo('member') // owner, admin, member

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['team_id', 'user_id'])
      table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE')
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

