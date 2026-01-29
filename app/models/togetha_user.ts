import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { afterCreate, beforeSave, belongsTo, column, computed, hasMany } from '@adonisjs/lucid/orm'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { type Attachment, attachment } from '@jrmc/adonis-attachment'
import type { DateTime } from 'luxon'
import { FileStoreRoutes } from '../enum/file_store.js'
import Activity from './activity.js'
import Notification from './notification.js'
import SuperBaseModel from './super_base.js'
import Team from './team.js'
import TeamMember from './team_member.js'
import Tenant from './tenant.js'

export type TogethaUserRoles = 'owner' | 'team_admin' | 'viewer'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(SuperBaseModel, AuthFinder) {
  @column() declare name: string
  @column() declare email: string
  @column({ serializeAs: null }) declare password: string
  @column() declare contactNumber: string
  @column() declare tfaCode: string
  @column() declare role: TogethaUserRoles
  @column() declare hasTempPassword: boolean
  @column() declare hostId: string

  @computed() public get isConfirmed() {
    return !!this.confirmedAt
  }

  @column() declare sortCode: string
  @column() declare accountNumber: string
  @column() declare iban: string
  @column() declare branchCode: string
  @column() declare swiftCode: string
  @column() declare bankName: string
  @column() declare bankAccountType: string
  @column() declare accountHolder: string

  @column() declare workEmail: string

  @column() declare addressLineOne: string
  @column() declare addressLineTwo: string
  @column() declare city: string
  @column() declare postCode: string
  @column() declare state: string
  @column() declare country: string

  @column() declare telephoneNumber: string
  @column() declare telephoneNumber2: string

  @column() declare companyName: string

  @column.dateTime() declare confirmedAt: DateTime

  @attachment({ folder: FileStoreRoutes.TENANT_PROFILE_IMAGES, preComputeUrl: true })
  declare avatar: Attachment

  @column() declare googleAccessToken: string
  @column() declare facebookAccessToken: string
  @column() declare tenantId: string
  @column() declare buyerId: string
  @column() declare landlordId: string
  @column() declare agencyId: string
  @column() declare teamMemberId: string
  @column() declare contractorId: string
  @column() declare contactId: string
  @column() declare adminId: string
  @column() declare rememberMeToken: string
  @column() declare permissions: ModelObject

  // ADDING OTP CODE
  @column({ columnName: 'is_2fa_enabled' }) declare is2faEnabled: boolean

  @column() declare metadata: {
    firstOrgId: string
    teamId?: string
    createdByAgency?: boolean
    agencyOrgId?: string
    createdByInvite?: boolean
    [x: string]: any
  }

  @column.dateTime() declare lastLoginAt: DateTime
  @column.dateTime() declare lastSeenAt: DateTime

  @computed()
  public get orgId() {
    return this?.metadata?.firstOrgId as string
  }

  @computed()
  public get isLandlord() {
    return !!this.landlordId
  }

  @computed()
  public get isTenant() {
    return !!this.tenantId
  }

  @computed()
  public get isBuyer() {
    return !!this.buyerId
  }

  @computed() public get isAgency() {
    return !!this.agencyId
  }

  @computed() public get isContractor() {
    return !!this.contractorId
  }

  @computed()
  public get isTeamMember() {
    return !!this.teamMemberId
  }

  @computed()
  public get isCoreUser() {
    return !!this.landlordId || !!this.agencyId || this.canMakeChanges
  }

  @computed()
  public get canMakeChanges() {
    return this.role === 'owner' || this.role === 'team_admin'
  }

  @computed() public get accountType() {
    // if landlordid is landlord, if agencyid is agency, teammemberid is teammember, if adminid is admin, if contractorid is contractor, if tenantid is tenant
    if (this.landlordId) return 'landlord'
    if (this.agencyId) return 'agency'
    if (this.teamMemberId) return 'teamMember'
    if (this.adminId) return 'admin'
    if (this.contractorId) return 'contractor'
    if (this.tenantId) return 'tenant'
    return 'user'
  }

  @computed() public get isHost() {
    return !!this.hostId
  }

  @computed() get hasBankAccountSetup() {
    return !!this.sortCode && !!this.accountNumber
  }

  @computed() get hasSetUpEUBankAccount() {
    return !!this.iban
  }

  @computed() get hasSetUpSouthAfricaBankAccount() {
    return !!this.branchCode && !!this.accountNumber && !!this.accountHolder
  }

  @computed() public get isInvitedByAgency() {
    return !!this.hostId && this.metadata.hostUserAccountType === 'agency'
  }

  @hasMany(() => Team) declare teams: HasMany<typeof Team>

  @hasMany(() => Notification) declare notifications: HasMany<typeof Notification>
  @belongsTo(() => TeamMember) declare teamMember: BelongsTo<typeof TeamMember>
  // @belongsTo(() => Contractor) declare contractor: BelongsTo<typeof Contractor>
  @belongsTo(() => Tenant) declare tenant: BelongsTo<typeof Tenant>

  @beforeSave()
  public static async lowerCaseEmail(user: User) {
    if (user.email) user.email = user.email.toLowerCase()
  }

  @afterCreate()
  public static async registerActivity(user: User) {
    // create a default team for the user

    await Activity.create(
      {
        userId: user.id,
        orgId: user.orgId,
        type: 'created',
        summary: 'Account created',
      },
      { client: user.$trx },
    )
  }

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30d',
  })

  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
}
