import { createHash } from 'node:crypto'

import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import TeamInvitation from '#models/team_invitation'
import TeamMember from '#models/team_member'
import User from '#models/user'
import { generateShortId } from '#services/app.functions'
import mailer from '#services/email_service'
import notificationService from '#services/notification_service'
import env from '#start/env'
import {
  acceptTeamInviteGuestValidator,
  inviteToTeamValidator,
  updateInvitationValidator,
} from '#validators/team'

const appUrl = env.get('APP_URL')

function hashInviteToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

type Trx = Awaited<ReturnType<typeof db.transaction>>

async function loadInvitationByToken(trx: Trx, token: string) {
  return TeamInvitation.query({ client: trx })
    .where('token_hash', hashInviteToken(token))
    .whereNull('accepted_at')
    .preload('invitedBy')
    .first()
}

async function ensureMember(trx: Trx, invitation: TeamInvitation, userId: string, now: DateTime) {
  const existing = await TeamMember.query({ client: trx }).where('user_id', userId).first()
  if (!existing) {
    await TeamMember.create(
      {
        userId,
        role: invitation.role,
        allowedPages: invitation.allowedPages ?? null,
        enableProdAccess: invitation.enableProdAccess ?? true,
        createdAt: now,
        updatedAt: now,
      },
      { client: trx },
    )
  }
}

async function notifyInviter(invitation: TeamInvitation, joiningUser: User) {
  if (invitation.invitedByUserId) {
    await notificationService.push({
      userId: invitation.invitedByUserId,
      title: 'Invite accepted',
      message: `${joiningUser.fullName || joiningUser.email} joined the dashboard`,
      type: 'success',
    })
  }
  if (invitation.invitedBy?.email) {
    await mailer.send({
      type: 'team-joined',
      data: {
        email: invitation.invitedBy.email,
        inviterName: invitation.invitedBy.fullName || invitation.invitedBy.email,
        teamName: 'the dashboard',
        joinedUserEmail: joiningUser.email,
        joinedUserName: joiningUser.fullName || joiningUser.email,
      },
    })
  }
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
      invitation,
      token,
      hasAccount: Boolean(existingUser),
      isAuthed: auth.isAuthenticated,
      isAuthedAsInvitee,
    })
  }

  async invite({ auth, request, response, now, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    const { email, role, allowedPages, enableProdAccess } =
      await request.validateUsing(inviteToTeamValidator)

    const normalizedEmail = email.toLowerCase().trim()

    const resolvedAllowedPages = (() => {
      const raw = Array.isArray(allowedPages) ? allowedPages : []
      return Array.from(new Set(raw))
    })()

    const existingUser = await User.findBy('email', normalizedEmail)
    if (existingUser) {
      const existingMember = await TeamMember.query().where('user_id', existingUser.id).first()

      if (existingMember) {
        return response.conflict({ error: 'That user is already a member.' })
      }
    }

    const nowSql = now.toSQL()

    const existingInvite = await TeamInvitation.query()
      .where('email', normalizedEmail)
      .whereNull('accepted_at')
      .where('expires_at', '>', nowSql!)
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
          email: normalizedEmail,
          role: role ?? 'member',
          invitedUserRole: 'admin',
          allowedPages: resolvedAllowedPages,
          enableProdAccess: enableProdAccess ?? true,
          tokenHash,
          invitedByUserId: user.id,
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
          inviterName: user.fullName || user.email,
          teamName: 'the dashboard',
          url: joinUrl,
        },
      })

      logger.info('Invite sent', {
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
    if (auth.isAuthenticated) {
      return response.badRequest({
        error:
          "You can't accept an invitation while logged in. Please log out and use the invite link again.",
      })
    }

    const guest = await request.validateUsing(acceptTeamInviteGuestValidator)
    const { token, fullName, password } = guest

    const trx = await db.transaction()
    const rollback = async <T>(result: T) => {
      await trx.rollback()
      return result
    }

    try {
      const invitation = await loadInvitationByToken(trx, token)
      if (!invitation) {
        return rollback(
          response.badRequest({ error: 'Invite is invalid or has already been used.' }),
        )
      }
      if (invitation.expiresAt.toMillis() < DateTime.now().toMillis()) {
        return rollback(response.badRequest({ error: 'Invite has expired.' }))
      }

      const existingUser = await User.query({ client: trx })
        .where('email', invitation.email)
        .first()
      if (existingUser) {
        return rollback(
          response.conflict({
            error: 'An account with this email already exists. Please log in to accept the invite.',
          }),
        )
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
          enableProdAccess: invitation.enableProdAccess ?? true,
        },
        { client: trx },
      )

      await ensureMember(trx, invitation, newUser.id, now)
      if (invitation.invitedUserRole === 'admin' && !newUser.isAdminOrSuperAdmin) {
        await newUser.merge({ role: 'admin' }).save()
      }

      await invitation.merge({ acceptedAt: now, acceptedByUserId: newUser.id }).save()
      await trx.commit()

      await auth.use('web').login(newUser)
      await notifyInviter(invitation, newUser)

      return response.ok({
        message: 'Account created and joined successfully.',
        redirectTo: invitation.invitedUserRole === 'admin' ? '/dashboard' : '/teams',
      })
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async updateInvitation({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const invitationId = request.param('invitationId')

    const invitation = await TeamInvitation.query()
      .where('id', invitationId)
      .whereNull('accepted_at')
      .firstOrFail()

    const body = await request.validateUsing(updateInvitationValidator)
    if (body.allowedPages !== undefined) {
      const pages = Array.isArray(body.allowedPages) ? body.allowedPages : null
      const resolved = pages?.length ? [...pages] : null
      invitation.allowedPages = resolved?.length ? resolved : null
    }
    if (body.enableProdAccess !== undefined) {
      invitation.enableProdAccess = body.enableProdAccess
    }
    await invitation.save()

    return response.ok({
      message: 'Invitation updated successfully',
      data: invitation,
    })
  }

  /**
   * Regenerate the invite token and return the invite link.
   * Any previously sent link will no longer work.
   */
  async inviteLink({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const invitationId = request.param('invitationId')

    const invitation = await TeamInvitation.query()
      .where('id', invitationId)
      .whereNull('accepted_at')
      .firstOrFail()

    const token = generateShortId(48)
    invitation.tokenHash = hashInviteToken(token)
    await invitation.save()

    const inviteLink = `${appUrl}/join?token=${token}`
    return response.ok({ inviteLink })
  }

  async destroy({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const invitationId = request.param('invitationId')

    const invitation = await TeamInvitation.query()
      .where('id', invitationId)
      .whereNull('accepted_at')
      .firstOrFail()

    await invitation.delete()
    return response.ok({ message: 'Invitation deleted.' })
  }
}
