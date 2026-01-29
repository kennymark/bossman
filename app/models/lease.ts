import { compose } from '@adonisjs/core/helpers'
import logger from '@adonisjs/core/services/logger'
import {
  afterCreate,
  afterDelete,
  afterSave,
  beforeSave,
  belongsTo,
  column,
  computed,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { type Attachment, attachment } from '@jrmc/adonis-attachment'
import { Auditable } from '@stouder-io/adonis-auditing'
import { DateTime } from 'luxon'
import Tenant from '#models/tenant'
import meiliSearchClient from '#services/meilisearch_service'
import type { TogethaCurrencies } from '#utils/currency'
import DateService from '#utils/date'
import LeaseUtils from '#utils/lease_utils'
import { FileStoreRoutes } from '../enum/file_store.js'
import Document from './document.js'
import type { LeaseSubmitters } from './lease_submitter.js'
import LeaseTenants from './lease_tenants.js'
import Org from './org.js'
import Payment from './payment.js'
import SuperBaseModel from './super_base.js'
import TenancyProcess from './tenancy_process.js'

export default class Lease extends compose(SuperBaseModel, Auditable) {
  @column({ isPrimary: true }) declare id: string
  @column() declare rentAmount: number
  @column() declare shortId: string
  @column() declare name: string
  @column() declare depositAmount: number
  @column() declare depositPaymentDate: DateTime
  @column() declare status: 'pending' | 'active' | 'inactive' | 'terminated'
  @column() declare frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  @attachment({ folder: FileStoreRoutes.LEASE_CONTRACTS, preComputeUrl: true })
  declare contractUrl: Attachment | null
  @column() declare paymentDay: number
  // @column() declare paymentMethod: PaymentMethod
  @column() declare leaseableEntityId: string
  @column() declare depositDueDate: DateTime
  @column() declare propertyId: string
  @column() declare unitId: string | null
  @column() declare roomId: string | null
  @column() declare currency: TogethaCurrencies

  // @belongsTo(() => LeaseableEntity) declare leaseableEntity: BelongsTo<typeof LeaseableEntity>

  @column() declare isManuallyCreated: boolean
  @column() declare orgId: string
  @column() declare tenantId: string

  @hasMany(() => Payment) declare payments: HasMany<typeof Payment>
  @hasMany(() => Document) declare documents: HasMany<typeof Document>
  @hasMany(() => TenancyProcess) declare leaseProcesses: HasMany<typeof TenancyProcess>

  @column.dateTime() declare startDate: DateTime
  @column.dateTime() declare endDate: DateTime | null
  @column.dateTime() declare earlyTerminationDate: DateTime | null
  @column() declare isPermanentlyRolling: boolean
  @column.dateTime() declare archivedAt: DateTime | null
  @column()
  declare approval: {
    approved: boolean
    status: 'booking-form-stage' | 'document-signing-stage' | 'deposit-payment-stage' | 'completed'
    eSignedAt?: boolean
    isRequired?: boolean
    approvedAt?: DateTime
    approver?: { name: string; id: string }
  }
  @column() declare application: Partial<LeaseApplication>
  @column()
  declare rollingStatus: Partial<{
    rolledOverAcceptedAt: DateTime | null
    hasRolled: boolean
    rolledOverRejectedAt: DateTime | null
    notifiedAt: DateTime | null
  }>

  @column()
  declare metadata: Partial<{
    renewal: {
      isRenewed: boolean
      status: 'pending' | 'active' | 'partial'
      completedAt?: string
    }
    isAmended: boolean
    lastAmendedAt?: DateTime
    paymentScheduleOption: 'custom' | 'auto'
    setPreviousPaymentsAsPaid: boolean | string
    setCurrentAdjustFrequencyAsPaid: boolean | string
    tenantName: string
    propertyName: string
    previousLeaseId?: string
    nextLeaseId?: string
    activeFromAppend?: boolean
    application: Partial<{
      expiresAt: string
      createdAt: string | null
      signByGuarantor: boolean
    }>
    deposit: {
      attempted: boolean | null
      attemptedAt: string | null
      paymentId?: string
    }
    listingApplication: {
      appliedAt: DateTime
      listingId: string
      applicationId: string
    }
    originalSubmitters: Array<{
      name: string
      email: string
      accountType: LeaseSubmitters
    }>
    dayRate: number
    numberOfWeeks: number
    yearlyPaymentDay: number
    yearlyPaymentMonth: number
  }>

  @computed() get hasCustomPaymentSchedule() {
    return this.metadata?.paymentScheduleOption === 'custom'
  }

  @computed() get actualAmountBasedOnFrequency() {
    const actualAmount =
      this.frequency === 'monthly'
        ? this.rentAmount
        : this.frequency === 'quarterly'
          ? this.rentAmount * 3
          : this.rentAmount * 12

    return actualAmount
  }

  @computed() get isELease() {
    return !this.isManuallyCreated
  }

  @computed() get isPending() {
    return this.status === 'pending'
  }

  @computed() get isExpired() {
    return this.endDate ? this.endDate < DateTime.now() : 'Permanently Rolling'
  }

  @computed() get remainingDuration() {
    if (this.isExpired) return 'Expired'
    if (this.endDate) {
      return LeaseUtils.timeRemaining(new Date().toISOString(), this.endDate.toISO() ?? '')
    }
    return 'No end date'
  }

  @beforeSave()
  public static markAsInactive(lease: Lease) {
    if (lease.$dirty.archivedAt && lease.archivedAt) {
      lease.status = 'inactive'
    }
  }

  @computed() get cleanName() {
    return this.name.replace('Agreement for ', '')
  }

  @computed() get tenantName() {
    return LeaseUtils.getTenantNameFromLeaseName(this.name)
  }

  @computed() get propertyAddress() {
    return LeaseUtils.getAddressFromLeaseName(this.name)
  }

  @belongsTo(() => Org) declare org: BelongsTo<typeof Org>

  // // only necessary for e-lease
  @column() declare options: Partial<LeaseOptions>
  @manyToMany(() => Tenant, {
    pivotTable: 'lease_tenants',
    serializeAs: 'tenants',
  })
  declare tenants: ManyToMany<typeof Tenant>

  @hasMany(() => LeaseTenants) declare leaseTenants: HasMany<typeof LeaseTenants>

  @afterSave()
  public static async updateSearchIndex(lease: Lease) {
    meiliSearchClient.index('leases').updateDocuments([
      {
        id: lease.id,
        name: lease.name,
        isArchived: !!lease.archivedAt,
        endDate: lease.endDate ? DateService.formatDate(lease.endDate) : null,
        isPermanentlyRolling: lease.isPermanentlyRolling,
        org_id: lease.orgId,
      },
    ])
  }

  @afterDelete()
  public static async deleteFromSearchIndex(lease: Lease) {
    meiliSearchClient.index('leases').deleteDocument(lease.id)
  }
}

export interface LeaseOptions {
  letOnlySettings: {
    sendPaymentsToLandlord?: boolean
    keepFirstRentPayment?: boolean
    landlordInfo?: {
      id?: string
      name?: string
      account?: {
        accountNumber?: string
        sortCode?: string
      }
    }
  }
  standardTemplate: {
    isSelected: boolean
    selectedTemplateName: '2023' | 'advance'
  }
  customTemplate: {
    isSelected: boolean
    selectedTemplateId?: string
  }
  selectedType?: 'pregenerated' | 'custom'
  allowPets: boolean
  allowSmoking: boolean
  customClauses?: string
  depositRollover: boolean
  depositIncluded: boolean
  parking: { isIncluded: boolean; parkingFee?: number }
  bills: {
    isIncluded: boolean
    includedBills: {
      internet?: boolean
      water?: boolean
      gas?: boolean
      electricity?: boolean
      councilTax?: boolean
    }
  }
  utilities: {
    name: string
    type: 'inclusive' | 'exclusive'
    responsibleParty: string
  }[]
  sharedFacilities: string[]
  deposit: Partial<{
    payer: { name?: string; address?: string }
    holder: string
  }>
  referenceNumber: string
  utilityCap: number
}

export interface LeaseApplication {
  bookingForm: { completed: boolean; completedAt?: DateTime }
  references: {
    employer?: {
      isRequired?: boolean
      completed?: boolean
      completedAt?: DateTime
    }
    previousLandlord?: {
      isRequired?: boolean
      completed?: boolean
      completedAt?: DateTime
    }
    guarantor?: {
      isRequired?: boolean
      completed?: boolean
      completedAt?: DateTime
    }
  }
  checks: {
    idCheck?: {
      isRequired?: boolean
      completed?: boolean
      completedAt?: DateTime
    }
    creditCheck?: {
      isRequired?: boolean
      completed?: boolean
      completedAt?: DateTime
    }
  }
  agreement: {
    templateId?: number
    submissionId?: number
    documentUrl?: string
    completedDocumentUrl?: string
    submitters?: {
      [x: string]: DocusealSubmission
    }
  }
}

interface DocusealSubmission {
  completed_at: string
  id: number
  submission_id: number
  email: string
  sent_at: string | null
  opened_at: string
  created_at: string
  updated_at: string
  name: string | null
  phone: string | null
  status: string
  role: string
  submission_url: string
  submission: {
    id: number
    audit_log_url: string | null
    created_at: string
    status: string
    url: string
  }
}
