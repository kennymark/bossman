import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blog_post_authors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.rawQuery('(lower(hex(randomblob(16))))').knexQuery)

      table.uuid('blog_post_id').notNullable().index()
      table.uuid('blog_author_id').notNullable().index()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.unique(['blog_post_id', 'blog_author_id'])
      table.foreign('blog_post_id').references('id').inTable('blog_posts').onDelete('CASCADE')
      table.foreign('blog_author_id').references('id').inTable('blog_authors').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

