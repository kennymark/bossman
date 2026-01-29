import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.rawQuery('(lower(hex(randomblob(16))))').knexQuery)

      table.uuid('team_id').notNullable().index()
      table.string('email').notNullable().index()
      table.string('role').notNullable().defaultTo('member') // owner, admin, member

      // Store a hash of the invite token (never store the raw token)
      table.string('token_hash').notNullable().unique()

      table.uuid('invited_by_user_id').notNullable().index()
      table.timestamp('expires_at').notNullable()

      table.timestamp('accepted_at').nullable()
      table.uuid('accepted_by_user_id').nullable().index()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE')
      table.foreign('invited_by_user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('accepted_by_user_id').references('id').inTable('users').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

