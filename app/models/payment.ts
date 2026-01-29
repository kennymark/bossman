import { afterDelete, afterSave, belongsTo, column, computed } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { attachment } from '@jrmc/adonis-attachment'
import type { Attachment } from '@jrmc/adonis-attachment/types/attachment'
import type { DateTime } from 'luxon'
import Landlord from '#models/landlord'
import Lease from '#models/lease'
import meiliSearchClient from '#services/meilisearch_service'
import DateService from '#utils/date'
import type { formData } from '../data/form-data.js'
import { FileStoreRoutes } from '../enum/file_store.js'
import SuperBaseModel from './super_base.js'

export type PaymentStatus =
  | 'paid'
  | 'processing'
  | 'overpaid'
  | 'underpaid'
  | 'unpaid'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'overdue'
  | 'zero'
export type PaymentMethod = 'bank_transfer' | 'cash' | 'link' | 'cheque' | 'in_app'
export default class Payment extends SuperBaseModel {
  @column({ isPrimary: true }) declare id: string

  @column() declare amountPaid: number
  @column() declare amountDue: number
  @column() declare description: string
  @column() declare reference: string
  @column() declare currencyCode: string
  @column() declare paymentProviderId: string
  @column() declare paymentProvider: string
  @column() declare paymentMethod: PaymentMethod
  @column() declare orgId: string
  @column() declare leaseId: string
  @column() declare notes: string
  @column() declare landlordId: string
  @column() declare category: (typeof formData.payments.categories)[number]
  @belongsTo(() => Lease) declare lease: BelongsTo<typeof Lease>
  @belongsTo(() => Landlord) declare landlord: BelongsTo<typeof Landlord>
  @column() declare status: PaymentStatus
  @column() declare isLetOnlyPayment: boolean

  @computed() get statusAlt(): PaymentStatus {
    const now = DateService.now
    if (this.amountDue === 0) return 'zero'
    if (this.amountPaid === this.amountDue) return 'paid'
    if (this.amountPaid > this.amountDue) return 'overpaid'
    if (this.dueDate && !this.paymentDate && this.dueDate < now) {
      if (this.amountPaid === 0) return 'overdue'
      if (!this.paymentDate) return 'overdue'
      if (this.amountPaid < this.amountDue) return 'underpaid'
      return 'overdue'
    }
    if (this.amountDue && !this.amountPaid) return 'unpaid'
    if (this.amountPaid < this.amountDue) return 'underpaid'
    return 'pending'
  }

  @attachment({ folder: FileStoreRoutes.RECEIPT_DOCS, preComputeUrl: true })
  declare receipt: Attachment | null

  @attachment({ folder: FileStoreRoutes.INVOICE_DOCS, preComputeUrl: true })
  declare invoice: Attachment | null

  @column.dateTime() declare dueDate: DateTime

  @column.dateTime() declare paymentDate: DateTime | null
  @column({ serializeAs: 'meta' }) declare metadata: ModelObject

  @computed() amountRemaining() {
    return this.amountDue - this.amountPaid
  }

  @afterSave()
  public static async updateSearchIndex(payment: Payment) {
    meiliSearchClient
      .index('payments')
      .updateDocuments([
        {
          id: payment.id,
          category: payment.category,
          description: payment.description,
          payment_method: payment.paymentMethod,
          payment_provider: payment.paymentProvider,
          org_id: payment.orgId,
        },
      ])
      .catch(console.error)
  }

  @afterDelete()
  public static async deleteFromSearchIndex(payment: Payment) {
    meiliSearchClient.index('payments').deleteDocument(payment.id).catch(console.error)
  }
}
