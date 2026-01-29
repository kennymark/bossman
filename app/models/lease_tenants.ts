import logger from '@adonisjs/core/services/logger'
import { afterCreate, afterDelete, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Lease from '#models/lease'
import Tenant from '#models/tenant'
import SuperBaseModel from './super_base.js'

export default class LeaseTenants extends SuperBaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare leaseId: string

  @column()
  declare tenantId: string

  @column()
  declare isLeadTenant: boolean

  @belongsTo(() => Lease)
  declare lease: BelongsTo<typeof Lease>

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @afterCreate()
  static async createTenancyProcess(leaseTenants: LeaseTenants) {
    logger.info(`Created tenancy process for tenant ${leaseTenants.tenantId}`)
  }

  @afterDelete()
  static async deleteTenancyProcess(leaseTenants: LeaseTenants) {
    logger.info(`Deleted tenancy process for tenant ${leaseTenants.tenantId}`)
  }
}
