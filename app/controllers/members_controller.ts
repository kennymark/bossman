import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import Lease from '#models/lease'
import LeaseableEntity from '#models/leaseable_entity'
import TeamInvitation from '#models/team_invitation'
import TeamMember from '#models/team_member'
import User from '#models/user'
import { updateMemberValidator } from '#validators/team'

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
      .sortBy(params.sortBy || 'createdAt', params.sortOrder || 'asc')
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

  async updateMember({ request, response }: HttpContext) {
    const memberId = request.param('memberId')
    const member = await TeamMember.query().where('id', memberId).firstOrFail()
    const body = await request.validateUsing(updateMemberValidator)

    const updates: Partial<{
      allowedPages: string[] | null
      enableProdAccess: boolean
      dataAccessMode: 'all' | 'selected'
      propertiesAccessMode: 'all' | 'selected'
      leasesAccessMode: 'all' | 'selected'
      allowedLeaseableEntityIds: string[] | null
      allowedLeaseIds: string[] | null
      dataAccessExpiresAt: DateTime | null
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
      const trimmed = String(body.dataAccessExpiresAt ?? '').trim()
      const parsed = trimmed ? DateTime.fromISO(trimmed) : null
      updates.dataAccessExpiresAt = parsed?.isValid ? parsed : null
    }

    member.merge(updates)
    await member.save()

    // Keep user.enableProdAccess in sync for easy checks
    const memberUser = await User.find(member.userId)
    if (memberUser) {
      memberUser.enableProdAccess = member.enableProdAccess
      await memberUser.save()
    }

    return response.ok({ message: 'Member updated successfully', data: member })
  }

  async destroy({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const memberId = request.param('memberId')
    const member = await TeamMember.query().where('id', memberId).firstOrFail()

    // Prevent removing yourself
    if (member.userId === user.id) {
      return response.badRequest({ error: 'You cannot remove yourself from the team.' })
    }

    await member.delete()
    return response.ok({ message: 'Member removed.' })
  }
}
