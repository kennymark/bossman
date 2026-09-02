import { BaseTransformer } from '@adonisjs/core/transformers'

import type Lease from '#models/lease'
import type LeaseableEntity from '#models/leaseable_entity'
import type Property from '#models/property'
import type Tenant from '#models/tenant'

/**
 * Minimal shapes for the relations a list row links to. Each carries just enough to
 * render a name and a link — never the parent record's full attribute set.
 */

export class TenantSummaryTransformer extends BaseTransformer<Tenant> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'email'])
  }
}

export class LeaseSummaryTransformer extends BaseTransformer<Lease> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'shortId', 'status'])
  }
}

export class LeaseableEntitySummaryTransformer extends BaseTransformer<LeaseableEntity> {
  toObject() {
    return this.pick(this.resource, ['id', 'address', 'type', 'propertyId'])
  }
}

export class PropertySummaryTransformer extends BaseTransformer<Property> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'addressLineOne',
      'city',
      'postCode',
      'leaseableEntityId',
    ])
  }
}
