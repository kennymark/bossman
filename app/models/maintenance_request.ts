import logger from '@adonisjs/core/services/logger'
import { afterDelete, afterSave, beforeSave, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Lease from './lease.js'
import LeaseableEntity from './leaseable_entity.js'
import Org from './org.js'
import Property from './property.js'
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
  @column.dateTime() declare dueDate: DateTime | null
  @column.dateTime() declare completionDate: DateTime | null
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
  @column.dateTime() declare archivedAt: DateTime | null

  @column() declare leaseableEntityId: string

  @belongsTo(() => LeaseableEntity) declare leaseableEntity: BelongsTo<typeof LeaseableEntity>

  @belongsTo(() => Tenant) declare tenant: BelongsTo<typeof Tenant>
  @belongsTo(() => Lease) declare lease: BelongsTo<typeof Lease>
  @belongsTo(() => Org) declare org: BelongsTo<typeof Org>
  @belongsTo(() => Property) declare property: BelongsTo<typeof Property>
  // @hasMany(() => Note) declare notes: HasMany<typeof Note>
  // @belongsTo(() => Contact) declare contact: BelongsTo<typeof Contact>
  // @hasMany(() => Photo, { foreignKey: 'maintenanceId' }) declare photos: HasMany<typeof Photo>

  @beforeSave()
  public static setDefaults(req: MaintenanceRequest) {
    if (!req.severity) req.severity = 'low'
    if (!req.status) req.status = 'todo'
    if (!req.type) req.type = 'general_maintenance'
  }
}
