import logger from '@adonisjs/core/services/logger'
import {
  afterDelete,
  afterSave,
  beforeFetch,
  beforeSave,
  belongsTo,
  column,
  computed,
  hasMany,
} from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { type Attachment, attachment } from '@jrmc/adonis-attachment'
import type { DateTime } from 'luxon'
import Org from '#models/org'
// import Property, { type CouncilTaxBand } from '#models/property'
// import Room from '#models/room'
// import Unit from '#models/unit'
import meiliSearchClient from '#services/meilisearch_service'
// import Document from './document.js'
import Lease from './lease.js'
// import Photo from './photo.js'
// import Sale from './sale.js'
import SuperBaseModel from './super_base.js'

export default class LeaseableEntity extends SuperBaseModel {
  @column({ isPrimary: true }) declare id: string
  @column() declare propertyId: string
  @column() declare description: string
  @column() declare unitId: string
  @column() declare roomId: string
  @column() declare type: 'unit' | 'room' | 'standalone' | 'property' | 'block'
  @column() declare subType: string
  @column() declare bedrooms: number
  @column() declare bathrooms: number
  @column() declare floor: number
  @attachment({}) declare floorPlan: Attachment | null
  @column() declare size: number
  @column() declare isFurnished: boolean
  @column() declare isVacant: boolean
  @column() declare isLetOnly: boolean
  @column() declare isForSale: boolean
  @column() declare isHmo: boolean
  // @column() declare councilTaxBand: CouncilTaxBand
  @column() declare address: string
  @column() declare orgId: string
  @column() declare metadata: ModelObject
  @column() declare features: string | string[]
  @column() declare vacancySummary: string
  @column() declare vacancyStatus: 'OCCUPIED' | 'ACTIVE' | 'PARTIALLY_OCCUPIED' | null
  @column() declare fees?: { managementFee: number; managementFeeType: 'percentage' | 'fixed' }
  @column() declare summary: string
  @column() declare isPublished: boolean
  @column() declare publishedAt: DateTime | null
  // @belongsTo(() => Property) declare property: BelongsTo<typeof Property>
  // @belongsTo(() => Property) declare parentProperty: BelongsTo<typeof Property>
  // @belongsTo(() => Unit) declare unit: BelongsTo<typeof Unit>
  // @belongsTo(() => Room) declare room: BelongsTo<typeof Room>
  @belongsTo(() => Org) declare org: BelongsTo<typeof Org>
  // @hasMany(() => Photo) declare photos: HasMany<typeof Photo>

  // @hasMany(() => Document)
  // declare documents: HasMany<typeof Document>

  @computed()
  get isUnit() {
    return this.unitId !== null
  }

  @computed()
  get isRoom() {
    return this.roomId !== null
  }

  @computed() get isProperty() {
    return this.type === 'standalone' || this.type === 'block'
  }

  @beforeSave()
  public static executePreSaveActions(entity: LeaseableEntity) {
    if (!entity.bathrooms) entity.bathrooms = 1
    if (!entity.bedrooms) entity.bedrooms = 1
    if (!entity.floor) entity.floor = 1
    if (typeof entity.features !== 'string') entity.features = JSON.stringify(entity.features)
    if (entity.address) entity.address = entity.address?.trim()
  }

  @computed() get isFullyManaged() {
    return !this.isLetOnly
  }

  get meta() {
    return this.$extras
  }

  @afterSave()
  public static async updateSearchIndex(entity: LeaseableEntity) {
    meiliSearchClient
      .index('leaseable_entities')
      .updateDocuments([
        {
          id: entity.id,
          address: entity.address,
          type: entity.type,
          sub_type: entity.subType,
          org_id: entity.orgId,
        },
      ])
      .then(() => {
        logger.info(`Updated search index for leaseable entity ${entity.id}`)
      })
      .catch((e) => {
        console.error('Error updating search index', e)
      })
  }

  @afterDelete()
  public static async deleteFromSearchIndex(entity: LeaseableEntity) {
    meiliSearchClient.index('leaseable_entities').deleteDocument(entity.id)
  }

  @hasMany(() => Lease) declare leases: HasMany<typeof Lease>
  // @hasMany(() => Sale) declare sales: HasMany<typeof Sale>
}
