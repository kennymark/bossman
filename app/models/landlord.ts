import { afterDelete, afterSave, column, computed, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import MaintenanceRequest from '#models/maintenance_request'
import Org from '#models/org'
import Property from '#models/property'
import Team from '#models/team'
import Tenant from '#models/tenant'
import User from '#models/user'
import meiliSearchClient from '#services/meilisearch_service'
import SuperBaseModel from './super_base.js'

export default class Landlord extends SuperBaseModel {
  @column({ isPrimary: true }) declare id: string
  @column() declare name: string
  @column() declare email: string
  @column() declare workEmail: string

  @column() declare orgId: string
  @column() declare agencyId: string
  @column() declare hasPropManager: boolean

  @column() declare address: {
    lineOne?: string
    lineTwo?: string
    city?: string
    postCode?: string
  }
  @column() declare account: ModelObject
  @column() declare contactNumber: string

  @hasMany(() => Property) declare properties: HasMany<typeof Property>
  @hasMany(() => MaintenanceRequest) declare maintenance: HasMany<typeof MaintenanceRequest>
  @hasOne(() => Org) declare org: HasOne<typeof Org>
  @hasOne(() => User) declare user: HasOne<typeof User>

  @hasMany(() => Team) declare teams: HasMany<typeof Team>
  @hasMany(() => Tenant) declare tenants: HasMany<typeof Tenant>

  @computed() public get isAgencyManagedLandlord() {
    return !!this.agencyId
  }

  @column() declare metadata: Partial<{
    hasAgency: boolean
    hasPropManager: boolean
    plaidAccessToken: string
    connectionCompletedAt: string
    firstOrgId: string
    fees: {
      managementFee: number
    }
  }>

  @afterSave()
  public static async updateSearchIndex(landlord: Landlord) {
    meiliSearchClient.index('landlords').updateDocuments([
      {
        id: landlord.id,
        name: landlord.name,
        email: landlord.email,
        org_id: landlord.orgId,
      },
    ])
  }

  @afterDelete()
  public static async deleteFromSearchIndex(landlord: Landlord) {
    meiliSearchClient.index('landlords').deleteDocument(landlord.id)
  }
}
