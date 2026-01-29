import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'blog_posts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.rawQuery('(lower(hex(randomblob(16))))').knexQuery)

      table.string('title').notNullable()
      table.string('slug').notNullable().unique().index()
      table.text('summary').nullable()
      table.text('content').nullable()

      table.string('thumbnail_url').nullable()
      table.string('cover_image_url').nullable()

      table.uuid('category_id').nullable().index()

      table.timestamp('published_at').nullable().index()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.foreign('category_id').references('id').inTable('blog_categories').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

