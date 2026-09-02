import { BaseTransformer } from '@adonisjs/core/transformers'

import type Document from '#models/document'
import OrgTransformer from '#transformers/org_transformer'
import {
  LeaseSummaryTransformer,
  LeaseableEntitySummaryTransformer,
  PropertySummaryTransformer,
  TenantSummaryTransformer,
} from '#transformers/related_summary_transformers'

/**
 * A document row for the console.
 *
 * Deliberately omits `file`, `url` and `externalFileUrl`: the console lists and
 * classifies documents but never hands out storage keys or signed URLs.
 */
export default class DocumentTransformer extends BaseTransformer<Document> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'fileName',
        'description',
        'docType',
        'isComplianceDocument',
        'canExpire',
        'expiresAt',
        'isExternallyVisible',
        'metadata',
        'leaseableEntityId',
        'leaseId',
        'tenantId',
        'propertyId',
        'orgId',
        'uploaderId',
        'archivedAt',
        'createdAt',
        'updatedAt',
      ]),
      org: OrgTransformer.transform(this.whenLoaded(this.resource.org)),
      tenant: TenantSummaryTransformer.transform(this.whenLoaded(this.resource.tenant)),
      lease: LeaseSummaryTransformer.transform(this.whenLoaded(this.resource.lease)),
      leaseableEntity: LeaseableEntitySummaryTransformer.transform(
        this.whenLoaded(this.resource.leaseableEntity),
      ),
      property: PropertySummaryTransformer.transform(this.whenLoaded(this.resource.property)),
    }
  }
}
