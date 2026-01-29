import { createHash } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { appUrl } from '#emails/global'
import Team from '#models/team'
import TeamInvitation from '#models/team_invitation'
import TeamMember from '#models/team_member'
import User from '#models/user'
import { getAdminPageAccessForUser } from '#services/admin_access_service'
import { generateShortId } from '#services/app.functions'
import mailer from '#services/email_service'
import notificationService from '#services/notification_service'
import {
  acceptTeamInviteAuthedValidator,
  acceptTeamInviteGuestValidator,
  inviteToTeamValidator,
  updateInvitationValidator,
} from '#validators/team'

function hashInviteToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export default class TeamInvitationsController {
  async joinPage({ auth, inertia, request }: HttpContext) {
    const token = request.qs().token

    if (!token || typeof token !== 'string') {
      return inertia.render('teams/join', {
        invitation: null,
        error: 'Invite token is required.',
      })
    }

    const tokenHash = hashInviteToken(token)
    const now = DateTime.now()

    const invitation = await TeamInvitation.query()
      .where('token_hash', tokenHash)
      .preload('team')
      .preload('invitedBy')
      .first()

    if (!invitation) {
      return inertia.render('teams/join', {
        invitation: null,
        error: 'This invite link is invalid.',
      })
    }

    if (invitation.acceptedAt) {
      return inertia.render('teams/join', {
        invitation: null,
        error: 'This invite has already been accepted.',
      })
    }

    if (invitation.expiresAt.toMillis() < now.toMillis()) {
      return inertia.render('teams/join', {
        invitation: null,
        error: 'This invite link has expired.',
      })
    }

    const existingUser = await User.findBy('email', invitation.email)
    const authedUser = auth.user
    const isAuthedAsInvitee = Boolean(authedUser && authedUser.email === invitation.email)

    return inertia.render('teams/join', {
      invitation: {
        email: invitation.email,
        teamName: invitation.team.name,
        inviterName: invitation.invitedBy?.fullName || invitation.invitedBy?.email || 'Someone',
        role: invitation.role,
        invitedUserRole: invitation.invitedUserRole,
        teamKind: invitation.team.kind,
        adminPages: invitation.adminPages ?? null,
      },
      token,
      hasAccount: Boolean(existingUser),
      isAuthed: auth.isAuthenticated,
      isAuthedAsInvitee,
    })
  }

  async invite({ auth, request, response, now, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    const freshUser = await User.findByOrFail('email', user.email)
    const { email, role, adminPages } = await request.validateUsing(inviteToTeamValidator)

    if (!user.emailVerified) {
      return response.forbidden({
        error: 'Please verify your email address before inviting others.',
      })
    }

    const teamId = request.param('teamId')
    const team = await Team.findOrFail(teamId)
    const isAdminTeam = team.kind === 'admin'
    const isAdmin = (user as { role?: string }).role === 'admin'

    if (isAdminTeam && !isAdmin) {
      return response.forbidden({ error: 'Admin access required to invite to this team.' })
    }
    if (isAdminTeam) {
      const allowed = await getAdminPageAccessForUser(freshUser.id)
      if (Array.isArray(allowed) && !allowed.includes('admin_teams')) {
        return response.forbidden({ error: 'You do not have access to manage admin teams.' })
      }
    }

    if (!isAdminTeam) {
      const membership = await TeamMember.query()
        .where('team_id', teamId)
        .where('user_id', freshUser.id)
        .first()

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return response.forbidden({
          error: 'You do not have permission to invite members to this team.',
        })
      }
    }

    const normalizedEmail = email.toLowerCase().trim()

    const resolvedAdminPages = (() => {
      if (!isAdminTeam) return null
      const raw = Array.isArray(adminPages) ? adminPages : []
      const unique = Array.from(new Set(raw))
      // Always include the admin landing page so invitees don't get stuck.
      if (!unique.includes('admin_dashboard')) unique.unshift('admin_dashboard')
      return unique
    })()

    const existingUser = await User.findBy('email', normalizedEmail)
    if (existingUser) {
      const existingMember = await TeamMember.query()
        .where('team_id', teamId)
        .where('user_id', existingUser.id)
        .first()

      if (existingMember) {
        return response.conflict({ error: 'That user is already a member of this team.' })
      }
    }

    const nowSql = now.toSQL()
    if (!nowSql) {
      return response.internalServerError({
        error: 'Unable to process invite right now. Please try again.',
      })
    }

    const existingInvite = await TeamInvitation.query()
      .where('team_id', teamId)
      .where('email', normalizedEmail)
      .whereNull('accepted_at')
      .where('expires_at', '>', nowSql)
      .first()

    if (existingInvite) {
      return response.ok({ message: 'An active invite has already been sent to this email.' })
    }

    const token = generateShortId(48)
    const tokenHash = hashInviteToken(token)
    const expiresAt = DateTime.now().plus({ days: 7 })

    const trx = await db.transaction()

    try {
      const invitation = await TeamInvitation.create(
        {
          teamId: team.id,
          email: normalizedEmail,
          role: role ?? 'member',
          invitedUserRole: 'admin',
          adminPages: resolvedAdminPages,
          tokenHash,
          invitedByUserId: freshUser.id,
          expiresAt,
          acceptedAt: null,
          acceptedByUserId: null,
          createdAt: now,
          updatedAt: now,
        },
        { client: trx },
      )

      await trx.commit()

      const joinUrl = `${appUrl}/join?token=${token}`
      await mailer.send({
        type: 'team-invite',
        data: {
          email: normalizedEmail,
          inviterName: freshUser.fullName || freshUser.email,
          teamName: team.name,
          url: joinUrl,
        },
      })

      logger.info('Team invite sent', {
        teamId: team.id,
        email: normalizedEmail,
        invitationId: invitation.id,
      })

      return response.created({ message: 'Invite sent successfully.' })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async accept({ auth, request, response, now }: HttpContext) {
    const isAuthed = auth.isAuthenticated
    const trx = await db.transaction()

    try {
      if (isAuthed) {
        const user = auth.getUserOrFail()
        const freshUser = await User.query({ client: trx }).where('email', user.email).firstOrFail()
        const { token } = await request.validateUsing(acceptTeamInviteAuthedValidator)

        const invitation = await TeamInvitation.query({ client: trx })
          .where('token_hash', hashInviteToken(token))
          .whereNull('accepted_at')
          .preload('team')
          .preload('invitedBy')
          .first()

        if (!invitation) {
          await trx.rollback()
          return response.badRequest({ error: 'Invite is invalid or has already been used.' })
        }

        if (invitation.expiresAt.toMillis() < DateTime.now().toMillis()) {
          await trx.rollback()
          return response.badRequest({ error: 'Invite has expired.' })
        }

        if (freshUser.email !== invitation.email) {
          await trx.rollback()
          return response.forbidden({
            error: 'You must be logged in with the invited email address.',
          })
        }

        const existingMember = await TeamMember.query({ client: trx })
          .where('team_id', invitation.teamId)
          .where('user_id', freshUser.id)
          .first()

        if (!existingMember) {
          await TeamMember.create(
            {
              teamId: invitation.teamId,
              userId: freshUser.id,
              role: invitation.role,
              adminPages: invitation.adminPages ?? null,
              createdAt: now,
              updatedAt: now,
            },
            { client: trx },
          )
        }

        if (
          invitation.invitedUserRole === 'admin' &&
          (freshUser as unknown as { role?: string }).role !== 'admin'
        ) {
          await freshUser.merge({ role: 'admin' }).save()
        }

        await invitation.merge({ acceptedAt: now, acceptedByUserId: freshUser.id }).save()
        await trx.commit()

        // Notify inviter (email + in-app)
        if (invitation.invitedByUserId) {
          await notificationService.push({
            userId: invitation.invitedByUserId,
            title: 'Team invite accepted',
            message: `${freshUser.fullName || freshUser.email} joined ${invitation.team.name}`,
            type: 'success',
          })
        }

        if (invitation.invitedBy?.email) {
          await mailer.send({
            type: 'team-joined',
            data: {
              email: invitation.invitedBy.email,
              inviterName: invitation.invitedBy.fullName || invitation.invitedBy.email,
              teamName: invitation.team.name,
              joinedUserEmail: freshUser.email,
              joinedUserName: freshUser.fullName || freshUser.email,
            },
          })
        }

        return response.ok({
          message: 'You have joined the team.',
          redirectTo: invitation.invitedUserRole === 'admin' ? '/dashboard' : '/teams',
        })
      }

      // Guest flow: create account + accept invite
      const { token, fullName, password } = await request.validateUsing(
        acceptTeamInviteGuestValidator,
      )

      const invitation = await TeamInvitation.query({ client: trx })
        .where('token_hash', hashInviteToken(token))
        .whereNull('accepted_at')
        .preload('team')
        .preload('invitedBy')
        .first()

      if (!invitation) {
        await trx.rollback()
        return response.badRequest({ error: 'Invite is invalid or has already been used.' })
      }

      if (invitation.expiresAt.toMillis() < DateTime.now().toMillis()) {
        await trx.rollback()
        return response.badRequest({ error: 'Invite has expired.' })
      }

      const existingUser = await User.query({ client: trx })
        .where('email', invitation.email)
        .first()
      if (existingUser) {
        await trx.rollback()
        return response.conflict({
          error: 'An account with this email already exists. Please log in to accept the invite.',
        })
      }

      const newUser = await User.create(
        {
          fullName,
          email: invitation.email,
          password,
          emailVerified: true,
          emailVerifiedAt: now,
          token: null,
          role: invitation.invitedUserRole,
        },
        { client: trx },
      )

      await TeamMember.create(
        {
          teamId: invitation.teamId,
          userId: newUser.id,
          role: invitation.role,
          adminPages: invitation.adminPages ?? null,
          createdAt: now,
          updatedAt: now,
        },
        { client: trx },
      )

      await invitation.merge({ acceptedAt: now, acceptedByUserId: newUser.id }).save()
      await trx.commit()

      await auth.use('web').login(newUser)

      // Notify inviter (email + in-app)
      if (invitation.invitedByUserId) {
        await notificationService.push({
          userId: invitation.invitedByUserId,
          title: 'Team invite accepted',
          message: `${newUser.fullName || newUser.email} joined ${invitation.team.name}`,
          type: 'success',
        })
      }

      if (invitation.invitedBy?.email) {
        await mailer.send({
          type: 'team-joined',
          data: {
            email: invitation.invitedBy.email,
            inviterName: invitation.invitedBy.fullName || invitation.invitedBy.email,
            teamName: invitation.team.name,
            joinedUserEmail: newUser.email,
            joinedUserName: newUser.fullName || newUser.email,
          },
        })
      }

      return response.ok({
        message: 'Account created and team joined successfully.',
        redirectTo: invitation.invitedUserRole === 'admin' ? '/dashboard' : '/teams',
      })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async updateInvitation({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const freshUser = await User.findByOrFail('email', user.email)
    const teamId = request.param('teamId')
    const invitationId = request.param('invitationId')

    const team = await Team.findOrFail(teamId)
    if (team.kind !== 'admin') {
      return response.forbidden({ error: 'Only admin team invitations can be updated here.' })
    }
    if ((user as { role?: string }).role !== 'admin') {
      return response.forbidden({ error: 'Admin access required.' })
    }
    const allowed = await getAdminPageAccessForUser(freshUser.id)
    if (Array.isArray(allowed) && !allowed.includes('admin_teams')) {
      return response.forbidden({ error: 'You do not have access to manage admin teams.' })
    }

    const invitation = await TeamInvitation.query()
      .where('team_id', teamId)
      .where('id', invitationId)
      .whereNull('accepted_at')
      .firstOrFail()

    const body = await request.validateUsing(updateInvitationValidator)
    if (body.adminPages !== undefined) {
      const pages = Array.isArray(body.adminPages) ? body.adminPages : null
      const resolved = pages?.length ? [...pages] : null
      if (resolved && !resolved.includes('admin_dashboard')) {
        resolved.unshift('admin_dashboard')
      }
      invitation.adminPages = resolved?.length ? resolved : null
      await invitation.save()
    }

    return response.ok({
      message: 'Invitation updated successfully',
      data: {
        id: invitation.id,
        adminPages: invitation.adminPages ?? null,
      },
    })
  }
}
