import type { HttpContext } from '@adonisjs/core/http'
import Team from '#models/team'
import TeamInvitation from '#models/team_invitation'
import TeamMember from '#models/team_member'
import User from '#models/user'
import { getAdminPageAccessForUser } from '#services/admin_access_service'
import { createTeamValidator } from '#validators/team'

export default class TeamsController {
  async index({ auth, response, request, now }: HttpContext) {
    const user = auth.getUserOrFail()
    const freshUser = await User.findByOrFail('email', user.email)

    const kindRaw = request.qs().kind
    const kind = kindRaw === 'admin' || kindRaw === 'user' ? kindRaw : 'user'
    const isAdmin = (user as { role?: string }).role === 'admin'

    if (kind === 'admin' && !isAdmin) {
      return response.forbidden({ error: 'Admin team access required.' })
    }
    if (kind === 'admin') {
      const allowed = await getAdminPageAccessForUser(freshUser.id)
      if (Array.isArray(allowed) && !allowed.includes('admin_teams')) {
        return response.forbidden({ error: 'You do not have access to admin teams.' })
      }

      // Admin "team" is implicit: ensure a default admin team exists.
      let adminTeam = await Team.query().where('kind', 'admin').orderBy('created_at', 'asc').first()
      if (!adminTeam) {
        adminTeam = await Team.create({
          name: 'Admin',
          kind: 'admin',
          createdByUserId: freshUser.id,
          createdAt: now,
          updatedAt: now,
        })
      }

      return response.ok({
        data: {
          teams: [adminTeam.serialize()],
        },
      })
    }

    const teams = await Team.query()
      .whereIn('id', TeamMember.query().select('team_id').where('user_id', freshUser.id))
      .where('kind', kind)
      .orderBy('created_at', 'desc')

    return response.ok({
      data: {
        teams: teams.map((t) => t.serialize()),
      },
    })
  }

  async store({ auth, request, response, now }: HttpContext) {
    const user = auth.getUserOrFail()
    const body = await request.validateUsing(createTeamValidator)
    const isAdmin = (user as { role?: string }).role === 'admin'
    const kind = body.kind === 'admin' && isAdmin ? 'admin' : 'user'

    if (!user.emailVerified) {
      return response.forbidden({
        error: 'Please verify your email address before creating a team.',
      })
    }
    if (kind === 'admin') {
      return response.badRequest({
        error: 'Teams are managed from the teams page. Use /teams to invite members.',
      })
    }

    const freshUser = await User.findByOrFail('email', user.email)

    const team = await Team.create({
      name: body.name,
      kind,
      createdByUserId: freshUser.id,
      createdAt: now,
      updatedAt: now,
    })

    await TeamMember.create({
      teamId: team.id,
      userId: freshUser.id,
      role: 'owner',
      adminPages: null,
      createdAt: now,
      updatedAt: now,
    })

    return response.created({
      message: 'Team created successfully',
      data: { team: team.serialize() },
    })
  }

  async members({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const freshUser = await User.findByOrFail('email', user.email)
    const teamId = request.param('teamId')
    const qs = request.qs()
    const page = Math.max(Number(qs.page ?? 1) || 1, 1)
    const perPage = Math.min(Math.max(Number(qs.perPage ?? 10) || 10, 1), 100)
    const search = typeof qs.search === 'string' ? qs.search.trim() : ''

    const team = await Team.findOrFail(teamId)
    const isAdmin = (user as { role?: string }).role === 'admin'
    if (team.kind === 'admin') {
      if (!isAdmin) return response.forbidden({ error: 'Admin team access required.' })
      const allowed = await getAdminPageAccessForUser(freshUser.id)
      if (Array.isArray(allowed) && !allowed.includes('admin_teams')) {
        return response.forbidden({ error: 'You do not have access to admin teams.' })
      }
      // For admin teams, any allowed admin can view members (no membership required).
    } else {
      const isMember = await TeamMember.query()
        .where('team_id', teamId)
        .where('user_id', freshUser.id)
        .first()

      if (!isMember) {
        return response.forbidden({ error: 'You do not have access to this team.' })
      }
    }

    const paginator = await TeamMember.query()
      .where('team_id', teamId)
      .if(search.length > 0, (q) => {
        q.whereHas('user', (uq) => {
          uq.whereILike('email', `%${search}%`).orWhereILike('full_name', `%${search}%`)
        })
      })
      .preload('user')
      .orderBy('created_at', 'asc')
      .paginate(page, perPage)

    const members = paginator.all()
    const meta = paginator.getMeta()

    // Also fetch pending invitations
    const pendingInvitations = await TeamInvitation.query()
      .where('team_id', teamId)
      .whereNull('accepted_at')
      .if(search.length > 0, (q) => {
        q.whereILike('email', `%${search}%`)
      })
      .preload('invitedBy')
      .orderBy('created_at', 'desc')

    return response.ok({
      data: {
        meta: {
          currentPage: meta.currentPage,
          perPage: meta.perPage,
          total: meta.total,
          lastPage: meta.lastPage,
        },
        members: members.map((m) => ({
          id: m.id,
          role: m.role,
          createdAt: m.createdAt.toISO() || '',
          fullName: m.user?.fullName || null,
          email: m.user?.email || null,
          adminPages: m.adminPages ?? null,
        })),
        invitations: pendingInvitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          createdAt: inv.createdAt.toISO() || '',
          invitedBy: inv.invitedBy?.fullName || inv.invitedBy?.email || null,
          adminPages: inv.adminPages ?? null,
        })),
      },
    })
  }
}
