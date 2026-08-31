import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import Lease from '#models/lease'
import LeaseableEntity from '#models/leaseable_entity'
import TeamInvitation from '#models/team_invitation'
import TeamMember from '#models/team_member'
import User from '#models/user'
import { recordAdminAction } from '#services/admin_audit_service'
import { CONFIRMATION_PHRASES, confirmationMatches } from '#utils/confirmation'
import { updateMemberValidator } from '#validators/team'

/** Columns `?sortBy=` may name. An arbitrary identifier must never reach ORDER BY. */
const MEMBER_SORTABLE_COLUMNS = ['created_at', 'updated_at', 'role'] as const

export default class MembersController {
  async index({ request, response }: HttpContext) {
    const params = await request.paginationQs()

    const members = await TeamMember.query()
      .if(params.search, (q) => {
        q.whereHas('user', (uq) => {
          uq.whereILike('email', `%${params.search}%`).orWhereILike(
            'fullName',
            `%${params.search}%`,
          )
        })
      })
      .preload('user')
      .orderBy('createdAt', 'asc')
      .sortBy(params.sortBy || 'created_at', params.sortOrder || 'asc', MEMBER_SORTABLE_COLUMNS)
      .paginate(params.page || 1, params.perPage || 10)

    return response.ok(members)
  }

  /**
   * @index
   * @operationId getProducts
   * @description Returns array of producs and it's relations
   * @responseBody 200 - <Product[]>.with(relations)
   * @paramUse(sortable, filterable)
   * @responseHeader 200 - @use(paginated)
   * @responseHeader 200 - X-pages - A description of the header - @example(test)
   */
  async invitations({ response }: HttpContext) {
    const pendingInvitations = await TeamInvitation.query()
      .whereNull('acceptedAt')
      .preload('invitedBy')
      .orderBy('createdAt', 'desc')

    return response.ok({
      data: {
        invitations: pendingInvitations,
      },
    })
  }

  async dataAccessOptions({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const [leaseableEntities, leases] = await Promise.all([
      LeaseableEntity.query({ connection: appEnv })
        .whereIn('type', ['standalone', 'block'])
        .select('id', 'address')
        .orderBy('address', 'asc'),
      Lease.query({ connection: appEnv }).select('id', 'name').orderBy('name', 'asc'),
    ])

    return response.ok({
      data: {
        leaseableEntities: leaseableEntities.map((e) => ({ id: e.id, address: e.address })),
        leases: leases.map((l) => ({ id: l.id, name: l.name })),
      },
    })
  }

  async updateMember(ctx: HttpContext) {
    const { request, response, auth } = ctx
    const actor = auth.getUserOrFail()
    const memberId = request.param('memberId')
    const member = await TeamMember.query().where('id', memberId).firstOrFail()
    const body = await request.validateUsing(updateMemberValidator)
    const hadProdAccess = member.enableProdAccess

    /**
     * Granting production access is not an ordinary settings change: it decides whether
     * this person reads live customer data. It needs a stated reason, and only a god
     * admin may hand it out.
     */
    if (body.enableProdAccess === true && !hadProdAccess) {
      if (!actor.isGodAdmin) {
        return response.forbidden({ error: 'Only a god admin may grant production access.' })
      }
      if (!body.prodAccessReason?.trim()) {
        return response.badRequest({
          error: 'A reason is required when granting production access.',
        })
      }
    }

    const updates: Partial<{
      allowedPages: string[] | null
      enableProdAccess: boolean
      dataAccessMode: 'all' | 'selected'
      propertiesAccessMode: 'all' | 'selected'
      leasesAccessMode: 'all' | 'selected'
      allowedLeaseableEntityIds: string[] | null
      allowedLeaseIds: string[] | null
      dataAccessExpiresAt: DateTime | null
      prodAccessExpiresAt: DateTime | null
    }> = {}
    if (body.allowedPages !== undefined) {
      const resolved = Array.isArray(body.allowedPages) ? [...body.allowedPages] : []
      if (resolved.length && !resolved.includes('dashboard')) resolved.unshift('dashboard')
      updates.allowedPages = resolved.length ? resolved : null
    }
    if (body.enableProdAccess !== undefined) updates.enableProdAccess = body.enableProdAccess
    if (body.dataAccessMode !== undefined) updates.dataAccessMode = body.dataAccessMode
    if (body.propertiesAccessMode !== undefined)
      updates.propertiesAccessMode = body.propertiesAccessMode
    if (body.leasesAccessMode !== undefined) updates.leasesAccessMode = body.leasesAccessMode
    if (body.propertiesAccessMode !== undefined || body.leasesAccessMode !== undefined) {
      const p = body.propertiesAccessMode ?? member.propertiesAccessMode ?? 'all'
      const l = body.leasesAccessMode ?? member.leasesAccessMode ?? 'all'
      updates.dataAccessMode = p === 'selected' || l === 'selected' ? 'selected' : 'all'
    }
    if (body.allowedLeaseableEntityIds !== undefined)
      updates.allowedLeaseableEntityIds = body.allowedLeaseableEntityIds?.length
        ? body.allowedLeaseableEntityIds
        : null
    if (body.allowedLeaseIds !== undefined)
      updates.allowedLeaseIds = body.allowedLeaseIds?.length ? body.allowedLeaseIds : null
    if (body.dataAccessExpiresAt !== undefined) {
      updates.dataAccessExpiresAt = parseOptionalDate(body.dataAccessExpiresAt)
    }
    if (body.prodAccessExpiresAt !== undefined) {
      updates.prodAccessExpiresAt = parseOptionalDate(body.prodAccessExpiresAt)
    }

    member.merge(updates)
    await member.save()

    // Keep user.enableProdAccess in sync for easy checks
    const memberUser = await User.find(member.userId)
    if (memberUser) {
      memberUser.enableProdAccess = member.enableProdAccess
      /** The expiry lives on both records so `resolveAppEnv` can read it off the user. */
      if (body.prodAccessExpiresAt !== undefined) {
        memberUser.prodAccessExpiresAt = member.prodAccessExpiresAt
      }
      if (body.enableProdAccess === true && !hadProdAccess) {
        memberUser.prodAccessReason = body.prodAccessReason?.trim() ?? null
        memberUser.prodAccessGrantedBy = actor.id
        memberUser.prodAccessGrantedAt = DateTime.now()
      }
      if (body.enableProdAccess === false) {
        memberUser.prodAccessExpiresAt = null
        memberUser.prodAccessReason = null
        memberUser.prodAccessGrantedBy = null
        memberUser.prodAccessGrantedAt = null
      }
      await memberUser.save()
    }

    if (body.enableProdAccess !== undefined && body.enableProdAccess !== hadProdAccess) {
      await recordAdminAction(ctx, {
        action: body.enableProdAccess ? 'member.prod_access_grant' : 'member.prod_access_revoke',
        targetType: 'TeamMember',
        targetId: member.id,
        targetLabel: memberUser?.email ?? member.userId,
        reason: body.prodAccessReason?.trim() ?? null,
        metadata: { expiresAt: member.prodAccessExpiresAt?.toISO() ?? null },
      })
    } else {
      await recordAdminAction(ctx, {
        action: 'member.update',
        targetType: 'TeamMember',
        targetId: member.id,
        targetLabel: memberUser?.email ?? member.userId,
        metadata: { changed: Object.keys(updates) },
      })
    }

    return response.ok({ message: 'Member updated successfully', data: member })
  }

  async destroy(ctx: HttpContext) {
    const { auth, request, response } = ctx
    const user = auth.getUserOrFail()
    const memberId = request.param('memberId')
    const member = await TeamMember.query().where('id', memberId).preload('user').firstOrFail()

    // Prevent removing yourself
    if (member.userId === user.id) {
      return response.badRequest({ error: 'You cannot remove yourself from the team.' })
    }

    const label = member.user?.email ?? member.userId
    const expected = CONFIRMATION_PHRASES['member.remove'](label)
    if (!confirmationMatches(request.input('confirm'), expected)) {
      return response.badRequest({
        error: `Type "${expected}" to confirm.`,
        type: 'confirmation',
      })
    }

    await member.delete()

    await recordAdminAction(ctx, {
      action: 'member.remove',
      targetType: 'TeamMember',
      targetId: memberId,
      targetLabel: label,
      reason: request.input('reason') ?? null,
    })

    return response.ok({ message: 'Member removed.' })
  }
}

/** Empty string and invalid input both mean "no limit". */
function parseOptionalDate(value: string | undefined): DateTime | null {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  const parsed = DateTime.fromISO(trimmed)
  return parsed.isValid ? parsed : null
}
