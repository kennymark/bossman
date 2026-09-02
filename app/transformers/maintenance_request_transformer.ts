import { BaseTransformer } from '@adonisjs/core/transformers'

import type MaintenanceRequest from '#models/maintenance_request'
import OrgTransformer from '#transformers/org_transformer'
import {
  LeaseSummaryTransformer,
  LeaseableEntitySummaryTransformer,
  PropertySummaryTransformer,
  TenantSummaryTransformer,
} from '#transformers/related_summary_transformers'

export default class MaintenanceRequestTransformer extends BaseTransformer<MaintenanceRequest> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'title',
        'description',
        'status',
        'severity',
        'type',
        'reportedBy',
        'dueDate',
        'completionDate',
        'agreedRepairDate',
        'cost',
        'isPrivate',
        'availableTime',
        'availableDays',
        'orgId',
        'tenantId',
        'leaseId',
        'leaseableEntityId',
        'propertyId',
        'contactId',
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
