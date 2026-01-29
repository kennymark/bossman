import logger from '@adonisjs/core/services/logger'
import {
  afterCreate,
  afterDelete,
  belongsTo,
  column,
  computed,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { attachment } from '@jrmc/adonis-attachment'
import type { Attachment } from '@jrmc/adonis-attachment/types/attachment'
import type { DateTime } from 'luxon'
import Lease from '#models/lease'
import LeaseableEntity from '#models/leaseable_entity'
import Org from '#models/org'
import Property from '#models/property'
import Tenant from '#models/tenant'
import User from '#models/user'
import { FileStoreRoutes } from '../enum/file_store.js'
import FileUpload from './file_upload.js'
import SuperBaseModel from './super_base.js'

export default class Document extends SuperBaseModel {
  @column({ isPrimary: true }) declare id: string
  @column() declare name: string
  @column() declare fileName: string
  @column() declare leaseableEntityId: string
  @column() declare externalFileUrl: string
  @column() declare uploaderId: string
  @column() declare leaseId: string
  @column() declare tenantId: string
  @column() declare propertyId: string | null
  @column() declare folderId: string
  @column() declare roomId: string
  @column() declare unitId: string
  @column() declare orgId: string
  @column() declare isExternallyVisible: boolean
  @column() declare isComplianceDocument: boolean
  @column() declare docType:
    | 'booking_form'
    | 'tenancy_agreement'
    | 'consent_form'
    | 'guarantor_form'
    | 'invoice'
    | 'id_document'
    | 'proof_of_address'
    | 'proof_of_affordability'
    | 'certificate'
    | 'contract'
    | 'other'

  @attachment({ preComputeUrl: true, folder: FileStoreRoutes.DOCUMENTS, disk: 'r2' })
  declare file: Attachment | null

  @belongsTo(() => User) declare user: BelongsTo<typeof User>
  @belongsTo(() => Lease) declare lease: BelongsTo<typeof Lease>
  @belongsTo(() => Tenant) declare tenant: BelongsTo<typeof Tenant>
  @belongsTo(() => Property) declare property: BelongsTo<typeof Property>
  @belongsTo(() => Org) declare org: BelongsTo<typeof Org>
  @belongsTo(() => LeaseableEntity) declare leaseableEntity: BelongsTo<typeof LeaseableEntity>
  @column() declare canExpire: boolean
  @column() declare metadata: Partial<{
    fromGuarantor: boolean
    renewalFrequency: string
    isIDocument: boolean
    isProofOfAddress: boolean
    referenceId: string
  }>
  @column() declare expiresAt: DateTime

  @manyToMany(() => User, { pivotTable: 'document_users' })
  declare visibleToUsers: ManyToMany<typeof User>

  //@hasMany(() => DocumentAccess) access: HasMany<typeof DocumentAccess>

  @computed() get url() {
    return this.file?.url || this.externalFileUrl || ''
  }

  @afterCreate()
  public static async recordFileUpload(document: Document) {
    // console.log('🚀 ~ Document ~ recordFileUpload ~ document:', document.toJSON())
    if (document.file?.name) {
      await FileUpload.create(
        {
          documentId: document.id,
          name: document.fileName || document.file?.originalName || 'Untitled',
          size: document.file.size,
          url: document.file.url || (await document.file.getUrl()) || document.file.name,
          fileExtension: document.file.extname || 'pdf',
          uploaderId: document.uploaderId,
          orgId: document.orgId,
          folderId: document.folderId,
        },
        { client: document.$trx },
      )
    } else {
      logger.error('No file attached')
    }
  }

  // @afterDelete()
  // public static async deleteCalendarEvent(document: Document) {
  //   try {
  //     const calendarEvent = await CalendarEvent.query()
  //       .where('category', 'compliance')
  //       .where('metadata->resourceId', document.id)
  //       .where('metadata->resourceType', 'document')
  //       .first()

  //     if (calendarEvent) {
  //       await calendarEvent.delete()
  //     }
  //   } catch {
  //     // Silently handle cases where JSON operators don't work or columns are missing
  //     // This prevents document deletion from failing due to calendar event cleanup issues
  //   }
  // }
}
