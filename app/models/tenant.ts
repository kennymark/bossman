import {
  afterSave,
  beforeSave,
  column,
  computed,
  hasMany,
  hasOne,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { HasMany, HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Document from '#models/document'
import Lease from '#models/lease'
import TogethaActivity from '#models/togetha_activity'
import User from '#models/user'
import meiliSearchClient from '#services/meilisearch_service'
import SuperBaseModel from './super_base.js'

export default class Tenant extends SuperBaseModel {
  @column({ isPrimary: true }) declare id: string
  @column() declare name: string
  @column() declare email: string
  @column() declare phoneNumber: string
  @column() declare shareCode: string
  @column.dateTime() declare dateOfBirth: DateTime | null
  @column.dateTime() declare createdAt: DateTime
  @column.dateTime() declare archivedAt: DateTime
  @column() declare country: string
  @column() declare sex: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  @column() declare isStudent: boolean
  @column() declare accountNumber: string
  @column() declare sortCode: string
  @column() declare metadata: {
    lastEmployerEmail?: string
    lastGuarantorEmail?: string
    lastPrevLandlordEmail?: string
  }

  @column() declare employment: {
    employer?: string
    occupation?: string
    monthlyIncome?: number
    status?: string
  }

  @column() declare guarantor: {
    name?: string
    email?: string
    phoneNumber?: string
    relationship?: string
  }

  @column() declare emergencyContact: {
    name: string
    email: string
    phoneNumber: string
    relationship: string
  }

  @column() declare address: {
    lineOne: string
    lineTwo?: string
    city: string
    postCode: string
    country: string
  }

  @column() declare studentDetails: {
    course?: string
    university?: string
    studentId?: string
    year?: string
  }

  @computed() get age() {
    if (!this.dateOfBirth) return null
    return DateTime.now().diff(this.dateOfBirth).years
  }

  @computed() get accountDetailsActive() {
    return !!this.accountNumber && !!this.sortCode
  }

  @computed() get addressDetails() {
    const line2 = this.address?.lineTwo ? this.address?.lineTwo : ''
    const full = `${line2} ${this.address?.lineOne}, ${this.address?.city}, ${this.address?.postCode}, ${this.address?.country}`

    return full
  }

  @hasMany(() => Document) declare documents: HasMany<typeof Document>
  @hasMany(() => TogethaActivity) declare activities: HasMany<typeof TogethaActivity>

  @hasOne(() => User) declare user: HasOne<typeof User>

  @manyToMany(() => Lease, {
    pivotTable: 'lease_tenants',
    serializeAs: 'leases',
  })
  declare leases: ManyToMany<typeof Lease>

  @beforeSave()
  public static async lowerCaseEmail(tenant: Tenant) {
    tenant.email = tenant.email.toLowerCase()
  }

  @beforeSave()
  public static async assignSex(tenant: Tenant) {
    if (!tenant.sex) tenant.sex = 'male'
  }

  @afterSave()
  public static async updateSearchIndex(tenant: Tenant) {
    meiliSearchClient.index('tenants').updateDocuments([
      {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
      },
    ])
  }

  @afterSave()
  public static async deleteFromSearchIndex(tenant: Tenant) {
    meiliSearchClient.index('tenants').deleteDocument(tenant.id)
  }
}
