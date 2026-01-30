import { BaseModel, beforeDelete, beforeSave, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Org from '#models/org'
import Property from '#models/property'
import TogethaUser from '#models/togetha_user'
import meiliSearchClient from '#services/meilisearch_service'

export default class Agency extends BaseModel {
  @column({ isPrimary: true }) declare id: string
  @column() declare name: string
  @column() declare email: string
  @column() declare orgId: string
  @column() declare createdAt: string
  @column() declare updatedAt: string

  @hasMany(() => Property) declare properties: HasMany<typeof Property>
  //@hasMany(() => MaintenanceRequest) declare maintenance: HasMany<typeof MaintenanceRequest>

  @hasOne(() => Org) declare org: HasOne<typeof Org>
  @hasOne(() => TogethaUser) declare user: HasOne<typeof TogethaUser>

  @column() declare metadata: Partial<{
    connectionCompletedAt: string
    onboardingCompletedAt: string
    firstOrgId: string
    fees: {
      managementFee: number
    }
  }>

  @beforeSave()
  public static async updateSearchIndex(agency: Agency) {
    meiliSearchClient.index('agencies').updateDocuments([
      {
        id: agency.id,
        name: agency.name,
        email: agency.email,
        org_id: agency.orgId,
      },
    ])
  }

  @beforeDelete()
  public static async deleteFromSearchIndex(agency: Agency) {
    meiliSearchClient.index('agencies').deleteDocument(agency.id)
  }
}
