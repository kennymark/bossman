import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.rawQuery('(lower(hex(randomblob(16))))').knexQuery)
      table.uuid('user_id').notNullable().index()
      table.string('title').notNullable()
      table.text('message').notNullable()
      table.string('type').notNullable().defaultTo('info') // info, success, warning, error
      table.boolean('read').defaultTo(false)
      table.timestamp('read_at').nullable()
      table.json('actions').nullable() // Array of action buttons
      table.json('data').nullable() // Additional metadata
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}