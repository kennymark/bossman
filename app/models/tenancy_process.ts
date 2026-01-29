import { compose } from '@adonisjs/core/helpers'
import { belongsTo, column, computed } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'
import { DateTime } from 'luxon'
import Lease from './lease.js'
import SuperBaseModel from './super_base.js'
import Tenant from './tenant.js'

export default class TenancyProcess extends compose(SuperBaseModel, Auditable) {
  @column({ isPrimary: true }) declare id: string

  @column()
  declare stage:
    | 'booking-form-stage'
    | 'document-signing-stage'
    | 'id-verification-stage'
    | 'deposit-payment-stage'
    | 'credit-check-stage'
    | 'background-check-stage'
    | 're-approved'
    | 'rejected'
    | 'unapproved'
    | 'completed'
    | 'edit-requested'

  @column() declare tenantId: string

  @column() declare leaseId: string

  @column() declare approvedBy: string | null

  @column() declare unapprovedBy: string | null

  @column() declare isLeadTenant: boolean

  @column.dateTime() declare approvedAt: DateTime | null

  @column.dateTime() declare signedAt: DateTime | null

  @column() declare completedDocumentUrl: string | null

  @column.dateTime() declare bookingFormCompletedAt: DateTime | null

  @column.dateTime({
    serialize(value) {
      return fixDate(value)
    },
  })
  declare idVerificationCompletedAt: DateTime | null

  @column.dateTime() declare depositPaymentCompletedAt: DateTime

  @column() declare currentDocumentUrl: string

  @column() declare submissionId: string

  @column() declare submissionTemplateId: string

  @column.dateTime() declare completedAt: DateTime | null

  @column() declare metadata: ModelObject

  @belongsTo(() => Tenant) declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => Lease) declare lease: BelongsTo<typeof Lease>

  @computed()
  get isBookingFormCompleted() {
    return this.bookingFormCompletedAt !== null
  }

  @computed() get currentStep() {
    if (this.bookingFormCompletedAt && this.approvedAt) return 'document-signing'
    if (this.completedDocumentUrl) return 'deposit-payment'
    if (this.completedAt) return 'summary'

    return 'booking-form'
  }

  @computed() get requiresApproval() {
    return (this.bookingFormCompletedAt && !this.approvedAt) || true
  }
}

function fixDate(value: string | number | object | DateTime) {
  if (value === null) {
    return null
  }
  if (typeof value === 'string') {
    return DateTime.fromISO(value)
  }
  if (typeof value === 'object') {
    // @ts-expect-error
    return DateTime.fromMillis(value.ts)
  }
  return value
}
