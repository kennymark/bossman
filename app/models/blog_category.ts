import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import { slugify } from '@adonisjs/lucid-slugify'
import SuperBaseModel from './super_base.js'
import BlogPost from './blog_post.js'

export default class BlogCategory extends SuperBaseModel {
  static table = 'blog_categories'

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
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => BlogPost)
  declare posts: HasMany<typeof BlogPost>
}

