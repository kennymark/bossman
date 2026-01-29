import { belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import { slugify } from '@adonisjs/lucid-slugify'
import SuperBaseModel from './super_base.js'
import BlogAuthor from './blog_author.js'
import BlogCategory from './blog_category.js'
import BlogTag from './blog_tag.js'

export default class BlogPost extends SuperBaseModel {
  static table = 'blog_posts'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  @slugify({
    strategy: 'dbIncrement',
    fields: ['title'],
  })
  declare slug: string

  @column()
  declare summary: string | null

  @column()
  declare content: string | null

  @column()
  declare thumbnailUrl: string | null

  @column()
  declare coverImageUrl: string | null

  @column()
  declare categoryId: string | null

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => BlogCategory, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof BlogCategory>

  @manyToMany(() => BlogTag, {
    pivotTable: 'blog_post_tags',
    pivotForeignKey: 'blog_post_id',
    pivotRelatedForeignKey: 'blog_tag_id',
  })
  declare tags: ManyToMany<typeof BlogTag>

  @manyToMany(() => BlogAuthor, {
    pivotTable: 'blog_post_authors',
    pivotForeignKey: 'blog_post_id',
    pivotRelatedForeignKey: 'blog_author_id',
  })
  declare authors: ManyToMany<typeof BlogAuthor>
}

