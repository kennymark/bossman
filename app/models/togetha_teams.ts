import logger from '@adonisjs/core/services/logger'
import { afterCreate, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import SuperBaseModel from './super_base.js'
import TeamMember from './team_member.js'

export default class TogethaTeam extends SuperBaseModel {
  static table = 'teams'
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare userId: string

  @column()
  declare orgId: string

  @hasOne(() => User)
  declare owner: HasOne<typeof User>

  @hasMany(() => TeamMember)
  declare members: HasMany<typeof TeamMember>

  @afterCreate()
  public static async createDefaultTeam(team: TogethaTeam) {
    logger.info(`${team.name} created`)
  }
}
