import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import SuperBaseModel from './super_base.js'
import Team from './team.js'
import type { TeamRole } from './team_member.js'
import User from './user.js'

export default class TeamInvitation extends SuperBaseModel {
  static table = 'team_invitations'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare teamId: string

  @column()
  declare email: string

  @column()
  declare role: TeamRole

  @column()
  declare invitedUserRole: 'admin' | 'normal_user'

  /**
   * Allowed admin page keys for this invite (only used for admin teams).
   * Stored as JSON text in DB.
   */
  @column({
    prepare: (value: string[] | null) => (Array.isArray(value) ? JSON.stringify(value) : null),
    consume: (value: unknown) => {
      if (typeof value !== 'string' || !value) return null
      try {
        const parsed = JSON.parse(value)
        if (!Array.isArray(parsed)) return null
        return parsed.filter((v) => typeof v === 'string')
      } catch {
        return null
      }
    },
  })
  declare adminPages: string[] | null

  @column({ serializeAs: null })
  declare tokenHash: string

  @column()
  declare invitedByUserId: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime()
  declare acceptedAt: DateTime | null

  @column()
  declare acceptedByUserId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Team)
  declare team: BelongsTo<typeof Team>

  @belongsTo(() => User, { foreignKey: 'invitedByUserId' })
  declare invitedBy: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'acceptedByUserId' })
  declare acceptedBy: BelongsTo<typeof User>
}
