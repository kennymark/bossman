import { afterDelete, afterSave, beforeSave, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import meiliSearchClient from '#services/meilisearch_service'
import Contact from './contact.js'
import Expense from './expense.js'
import Lease from './lease.js'
import LeaseableEntity from './leaseable_entity.js'
import Note from './note.js'
import Photo from './photo.js'
import SuperBaseModel from './super_base.js'
import Tenant from './tenant.js'

export type MaintenanceRequestStatus = 'todo' | 'in_progress' | 'complete' | 'postponed'
export type MaintenanceRequestSeverity = 'low' | 'moderate' | 'high'

export default class MaintenanceRequest extends SuperBaseModel {
  @column({ isPrimary: true }) declare id: string
  @column() declare title: string
  @column() declare description: string
  @column() declare status: MaintenanceRequestStatus
  @column() declare severity: MaintenanceRequestSeverity
  @column() declare type: string
  @column() declare reportedBy: 'tenant' | string
  @column() declare dueDate: DateTime
  @column() declare completionDate: DateTime
  @column() declare cost: number
  @column() declare orgId: string
  @column() declare contactId: string | null
  @column() declare tenantId: string
  @column() declare leaseId: string
  @column() declare isPrivate: boolean
  @column() declare availableTime: string
  @column({ prepare: (value) => JSON.stringify(value) }) declare availableDays: string[]
  @column.dateTime() declare agreedRepairDate: DateTime
  @column() declare propertyId: string

  @column() declare leaseableEntityId: string

  @belongsTo(() => LeaseableEntity) declare leaseableEntity: BelongsTo<typeof LeaseableEntity>

  @belongsTo(() => Contact) declare contact: BelongsTo<typeof Contact>
  @belongsTo(() => Tenant) declare tenant: BelongsTo<typeof Tenant>
  @belongsTo(() => Lease) declare lease: BelongsTo<typeof Lease>
  @hasMany(() => Note) declare notes: HasMany<typeof Note>
  @hasMany(() => Photo, { foreignKey: 'maintenanceId' }) declare photos: HasMany<typeof Photo>
  @hasMany(() => Expense, { foreignKey: 'maintenanceRequestId' }) declare expenses: HasMany<
    typeof Expense
  >

  @beforeSave()
  public static setDefaults(req: MaintenanceRequest) {
    if (!req.severity) req.severity = 'low'
    if (!req.status) req.status = 'todo'
    if (!req.type) req.type = 'general_maintenance'
  }

  @afterSave()
  public static async updateSearchIndex(request: MaintenanceRequest) {
    meiliSearchClient
      .index('maintenance_requests')
      .updateDocuments([
        {
          id: request.id,
          title: request.title,
          severity: request.severity,
          status: request.status,
          reported_by: request.reportedBy,
          description: request.description,
          org_id: request.orgId,
        },
      ])
      .catch(console.log)
  }

  @afterDelete()
  public static async deleteFromSearchIndex(request: MaintenanceRequest) {
    meiliSearchClient.index('maintenance_requests').deleteDocument(request.id).catch(console.log)
  }
}
