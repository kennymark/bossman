import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { DateTime } from 'luxon'

export type LeaseSubmitters =
  | 'tenant'
  | 'landlord'
  | 'landlord(me)'
  | 'agency'
  | 'agency_member'
  | 'guarantor'
  | 'employer'

export default class LeaseSubmitter extends BaseModel {
  @column({ isPrimary: true }) declare id: number

  @column() declare leaseId: string

  @column() declare name: string

  @column() declare email: string

  @column() declare accountType: LeaseSubmitters

  @column() declare hasSigned: boolean

  @column.dateTime() declare signedAt: DateTime | null
  @column() declare metadata: ModelObject

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
