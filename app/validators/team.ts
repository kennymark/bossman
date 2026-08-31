import vine from '@vinejs/vine'

import { PAGE_KEYS } from '#utils/page_access'

const email = vine.string().toLowerCase().trim().email()

export const inviteToTeamValidator = vine.create(
  vine.object({
    email,
    role: vine.enum(['owner', 'admin', 'member']).optional(),
    allowedPages: vine.array(vine.enum(PAGE_KEYS)).optional(),
    enableProdAccess: vine.boolean().optional(),
  }),
)

export const acceptTeamInviteGuestValidator = vine.create(
  vine.object({
    token: vine.string().trim(),
    fullName: vine.string().trim().minLength(2).maxLength(255),
    password: vine.string().minLength(8),
    confirmPassword: vine.string().confirmed({ confirmationField: 'password' }),
  }),
)

export const acceptTeamInviteAuthedValidator = vine.create(
  vine.object({
    token: vine.string().trim(),
  }),
)

export const updateMemberValidator = vine.create(
  vine.object({
    allowedPages: vine.array(vine.enum(PAGE_KEYS)).optional(),
    enableProdAccess: vine.boolean().optional(),
    dataAccessMode: vine.enum(['all', 'selected']).optional(),
    propertiesAccessMode: vine.enum(['all', 'selected']).optional(),
    leasesAccessMode: vine.enum(['all', 'selected']).optional(),
    allowedLeaseableEntityIds: vine.array(vine.string()).optional(),
    allowedLeaseIds: vine.array(vine.string()).optional(),
    /** Optional time limit on access to properties & leases; empty = no limit. */
    dataAccessExpiresAt: vine.string().optional(),
    /** Optional time limit on production database access; empty = no limit. */
    prodAccessExpiresAt: vine.string().optional(),
    /** Required when turning production access on, so the grant is justified in the log. */
    prodAccessReason: vine.string().trim().maxLength(500).optional(),
  }),
)

export const updateInvitationValidator = vine.create(
  vine.object({
    allowedPages: vine.array(vine.enum(PAGE_KEYS)).optional(),
    enableProdAccess: vine.boolean().optional(),
  }),
)
