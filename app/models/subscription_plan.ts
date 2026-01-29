import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class SubscriptionPlan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare pricingId: string

  @column()
  declare billingFrequency: 'monthly' | 'yearly' | 'other'

  @column()
  declare subscriptionPlanId: string

  @column()
  declare metadata: ModelObject

  @column()
  declare orgId: string

  @belongsTo(() => SubscriptionPlan)
  declare org: BelongsTo<typeof SubscriptionPlan>

  @column() get description() {
    return `togetha ${this.name} ${this.billingFrequency}`
  }
}
