import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'push_notifications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /**
       * Which Togetha database the audience was resolved against when the notification
       * was created. Required so the scheduled sender targets the same env.
       */
      table.string('app_env', 8).notNullable().defaultTo('dev')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('app_env')
    })
  }
}
