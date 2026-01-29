import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Lease from './lease.js'
import Property from './property.js'

import TeamMember from './team_member.js'
import type { ActivityType } from './togetha_activity.js'
import User from './user.js'

export default class Activity extends BaseModel {
  @column({ isPrimary: true }) declare id: string
  @column() declare type: ActivityType
  @column() declare userId: string
  @column() declare propertyId: string
  @column() declare leaseableEntityId: string
  @column() declare unitId: string
  @column() declare keywords: string
  @column() declare leaseId: string
  @column() declare saleId: string
  @column() declare tenantId: string
  @column() declare teamMemberId: string
  @column() declare paymentId: string
  @column() declare teamId: string
  @column() declare taskId: string
  @column() declare broadcastId: string
  @column() declare templateId: string
  @column() declare photoId: string
  @column() declare calendarEventId: string
  @column() declare roomId: string
  @column() declare contractorId: string
  @column() declare contactId: string
  @column() declare maintenanceId: string
  @column() declare noteId: string
  @column() declare renewalId: string
  @column() declare documentId: string
  @column() declare fileUploadId: string
  @column() declare inviteId: string
  @column() declare referenceId: string
  @column() declare summary: string
  @column() declare orgId: string
  @column() declare isSystemAction: boolean

  @column() declare data: ModelObject

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { localKey: 'id', foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
  @belongsTo(() => TeamMember) declare teamMember: BelongsTo<typeof TeamMember>
  @belongsTo(() => Property) declare property: BelongsTo<typeof Property>
  @belongsTo(() => Lease) declare lease: BelongsTo<typeof Lease>

  @beforeCreate()
  public static async setAppVersion(activity: Activity) {
    activity.data = activity.data || {}
    activity.data.fromV2 = true
  }
}
