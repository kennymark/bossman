import { slugify } from '@adonisjs/lucid-slugify'
import { BaseModel, column, computed } from '@adonisjs/lucid/orm'
import { Attachment, attachment } from '@jrmc/adonis-attachment'
import type { DateTime } from 'luxon'

import { FileStoreRoutes } from '../enum/file_store.ts'

export default class BlogPost extends BaseModel {
  static table = 'blog_posts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare body: string

  @column()
  @slugify({ fields: ['title'], strategy: 'dbIncrement' })
  declare slug: string

  @column() declare excerpt: string | null

  @attachment({ folder: FileStoreRoutes.BLOG_IMAGES, preComputeUrl: false })
  declare coverImage: Attachment | null

  @column()
  declare coverImageAltUrl: string | null

  @computed() get isPublished() {
    return Boolean(this.publishedAt)
  }

  @column.dateTime()
  declare publishedAt: DateTime | null

  @column.dateTime()
  declare scheduledAt: DateTime | null

  @column()
  declare scheduleJobId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
