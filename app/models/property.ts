import { compose } from '@adonisjs/core/helpers'
import { belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'
import LeaseableEntity from '#models/leaseable_entity'
import TogethaActivity from '#models/togetha_activity'
import Document from './document.js'
import Landlord from './landlord.js'
import Lease from './lease.js'
import Org from './org.js'

import SuperBaseModel from './super_base.js'

export type CouncilTaxBand = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'unknown'
export default class Property extends compose(SuperBaseModel, Auditable) {
  @column({ isPrimary: true })
  declare id: string
  serializeExtras = true

  @column() declare orgId: string
  @column() declare landlordId: string
  @column() declare addressLineOne: string
  @column() declare addressLineTwo: string
  @column() declare city: string
  @column() declare postCode: string
  @column() declare state: string
  @column() declare country: string
  @column() declare propertyType: string
  @column() declare noOfUnits: number
  @column() declare noOfFloors: number
  @column() declare leaseableEntityId: string
  @belongsTo(() => Landlord) declare landlord: BelongsTo<typeof Landlord>
  @belongsTo(() => Org) declare org: BelongsTo<typeof Org>
  @hasMany(() => Lease, {}) declare leases: HasMany<typeof Lease>
  @hasMany(() => TogethaActivity) declare activities: HasMany<typeof TogethaActivity>
  //@hasMany(() => Photo) declare photos: HasMany<typeof Photo>
  @hasMany(() => Document) declare documents: HasMany<typeof Document>

  @column() public get summarizedAddress() {
    return `${this.addressLineOne}, ${this.city}, ${this.postCode}`
  }

  @column() public get summarizedAddressAlt() {
    const addLine2 = this.addressLineTwo ? `${this.addressLineTwo}, ` : ''
    return ` ${addLine2} ${this.addressLineOne}, ${this.city}, ${this.postCode}`
  }

  get meta() {
    return this.$extras
  }

  @hasOne(() => LeaseableEntity) declare leaseableEntity: HasOne<typeof LeaseableEntity>
  @hasMany(() => LeaseableEntity) declare leaseableEntities: HasMany<typeof LeaseableEntity>
}
