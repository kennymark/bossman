import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('ip_address', 45).nullable() // IPv6 can be up to 45 chars
      table.text('user_agent').nullable()
      table.string('device_type').nullable() // mobile, desktop, tablet
      table.string('browser').nullable()
      table.string('os').nullable()
      table.string('location').nullable() // Could be city/country if using geolocation
      table.boolean('is_current').defaultTo(false) // Whether this is the current session
      table.timestamp('last_activity').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('user_id')
      table.index('last_activity')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
