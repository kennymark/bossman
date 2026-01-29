import { belongsTo, column, computed, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Lease from '#models/lease'
import Listings from '#models/listings'
import Payment from '#models/payment'
import type { AppCountries } from '#types/extra'
import type { TogethaCurrencies } from '#utils/currency'
import { type PlanFeatures, plansFeatureList } from '../data/subscription.js'
import SubPlansReversed from '../enum/sub_plan.js'
import CalendarEvent from './calendar_event.js'
import SubscriptionPlan from './subscription_plan.js'
import SuperBaseModel from './super_base.js'
import User from './user.js'

export default class Org extends SuperBaseModel {
  @column({ isPrimary: true }) declare id: string
  @column() declare name: string
  @column() declare description: string
  @column() declare settings: Partial<{
    preferredCurrency: TogethaCurrencies
    preferredTimezone: string
    preferredDateFormat: string
    weeklyDigest: boolean
    monthlyDigest: boolean
    autoArchiveLeases: boolean
    enablePayments: boolean
    notifications: {
      leaseExpiry: boolean
      rentPaymentReminder: boolean
      complianceDocExpiration: boolean
    }
  }>
  @column() declare planId: number
  @column({}) declare subscriptionId: string
  @column() declare customPlanFeatures: ModelObject
  @column() declare paymentCustomerId: string
  @column() declare isMainOrg: boolean
  @column() declare ownerRole: 'landlord' | 'agency'
  @column() declare creatorEmail: string
  @column({ serializeAs: null }) declare plaidRecipientId: string
  @column({ serializeAs: null }) declare plaidAccessToken: string
  @column() declare parentOrgId: string
  @column() declare hasActiveSubscription: boolean
  @column() declare isSalesOrg: boolean

  @computed() get cleanName() {
    if (!this?.name) return ''
    return this.name?.replace(/\s*org\b/i, '').trim()
  }

  @computed() get email() {
    return this.creatorEmail
  }

  @computed() get isUK() {
    return this.country === 'United Kingdom'
  }

  @computed() get isLandlord() {
    return this.ownerRole === 'landlord'
  }

  @computed() get isAgency() {
    return this.ownerRole === 'agency'
  }
  @column() declare xeroTokenSet: {
    accessToken: string
    refreshToken: string
    idToken: string
    expiresAt: number
    tokenType: string
    scope: string
    sessionState: string
    //claims: () => IdTokenClaims
    expired: () => boolean
  }

  @column() declare companyName: string
  @column() declare companyWebsite: string
  @column() declare companyEmail: string
  @column() declare country: AppCountries
  @column() declare isWhiteLabelEnabled: string
  @column() declare whiteLabelDetails: ModelObject
  @column() declare stripeConnectId: string

  @column() declare customPaymentSchedule: 'monthly' | 'quarterly' | 'yearly'
  @column() declare customRenewalDate: DateTime
  @column() declare customExpiryDate: DateTime
  // @attachment({ preComputeUrl: true }) companyLogo: AttachmentContract | null
  // @attachment({ preComputeUrl: true }) companyFavicon: AttachmentContract | null

  @column() declare metadata: {
    hasUpdatedAccount: boolean
    plaidAccessToken: string
    connectionCompletedAt: string
    onboardingCompletedAt: string
  }

  @computed() get isBankAccountLinked() {
    return !!this.plaidRecipientId && !!this.plaidAccessToken
  }

  @computed() hasUpdatedAccount() {
    return this.metadata.hasUpdatedAccount
  }

  @column() public get isSubscribedToAPlan() {
    return !!this.planId
  }

  @computed()
  public get isOnCustomPlan() {
    return !!this.customPlanFeatures
  }

  @computed() get currency() {
    return this?.settings?.preferredCurrency
  }

  @computed()
  public get featureList(): PlanFeatures | ModelObject {
    if (this.isOnCustomPlan) {
      return this.customPlanFeatures
    }
    const plan = SubPlansReversed.get(this.planId)
    if (!plan) {
      return plansFeatureList.standard
    }
    const parsedPlan = plan === 'free_trial' ? plan : plan.split('_')[0]
    const list = plansFeatureList[parsedPlan as keyof typeof plansFeatureList]

    return list || plansFeatureList.standard
  }

  @computed()
  public get planName() {
    if (this.isOnCustomPlan) return 'custom'
    const plan = SubPlansReversed.get(this.planId)
    return plan
  }

  @hasOne(() => SubscriptionPlan, { localKey: 'planId', foreignKey: 'id' }) declare plan: HasOne<
    typeof SubscriptionPlan
  >

  @hasMany(() => Lease) declare leases: HasMany<typeof Lease>
  @hasMany(() => Listings) declare listings: HasMany<typeof Listings>
  @hasMany(() => Payment) declare payments: HasMany<typeof Payment>
  @hasMany(() => CalendarEvent) declare events: HasMany<typeof CalendarEvent>

  @belongsTo(() => Org, { localKey: 'parentOrgId' }) declare parentOrg: BelongsTo<typeof Org>

  @hasOne(() => User, { localKey: 'creatorEmail', foreignKey: 'email' }) declare owner: HasOne<
    typeof User
  >
}
