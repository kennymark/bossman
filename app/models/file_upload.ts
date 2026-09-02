import { compose } from '@adonisjs/core/helpers'
import logger from '@adonisjs/core/services/logger'
import { beforeDelete, beforeSave, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'

import { convertBytesToMb } from '#utils/functions'

import Document from './document.js'
import Org from './org.js'
import SuperBaseModel from './super_base.js'
import User from './user.js'

export default class FileUpload extends compose(SuperBaseModel, Auditable) {
  @column({ isPrimary: true }) declare id: string

  @column() declare documentId: string

  @column() declare name: string

  @column() declare size: number

  @column() declare mimeType: string

  @column() declare url: string

  @column() declare fileExtension: string

  @column() declare uploaderId: string

  @column() declare photoId: string

  @column() declare orgId: string

  @column() declare folderId: string

  @belongsTo(() => User, { foreignKey: 'uploaderId' })
  declare uploader: BelongsTo<typeof User>

  @belongsTo(() => Org) declare org: BelongsTo<typeof Org>

  @belongsTo(() => Document) declare document: BelongsTo<typeof Document>

  @beforeSave() static async sizeInMb(file: FileUpload) {
    if (file.$dirty.password) {
      file.size = Number(convertBytesToMb(file.size))
    }
  }
}
