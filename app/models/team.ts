import { compose } from '@adonisjs/core/helpers'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { Auditable } from '@stouder-io/adonis-auditing'
import type { DateTime } from 'luxon'
import SuperBaseModel from './super_base.js'
import TeamInvitation from './team_invitation.js'
import TeamMember from './team_member.js'
import User from './user.js'

export default class Team extends compose(SuperBaseModel, Auditable) {
  static table = 'teams'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare kind: 'user' | 'admin'

  @column()
  declare name: string

  @column()
  declare createdByUserId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  @hasMany(() => TeamMember)
  declare members: HasMany<typeof TeamMember>

  @hasMany(() => TeamInvitation)
  declare invitations: HasMany<typeof TeamInvitation>
}
