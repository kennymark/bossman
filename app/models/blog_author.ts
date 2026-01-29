import { column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import { slugify } from '@adonisjs/lucid-slugify'
import SuperBaseModel from './super_base.js'
import BlogPost from './blog_post.js'

export default class BlogAuthor extends SuperBaseModel {
  static table = 'blog_authors'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  @slugify({
    strategy: 'dbIncrement',
    fields: ['name'],
  })
  declare slug: string

  @column()
  declare email: string | null

  @column()
  declare avatarUrl: string | null

  @column()
  declare bio: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @manyToMany(() => BlogPost, {
    pivotTable: 'blog_post_authors',
    pivotForeignKey: 'blog_author_id',
    pivotRelatedForeignKey: 'blog_post_id',
  })
  declare posts: ManyToMany<typeof BlogPost>
}

