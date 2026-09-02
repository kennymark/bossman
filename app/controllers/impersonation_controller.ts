import type { HttpContext } from '@adonisjs/core/http'

import Org from '#models/org'
import { recordAdminAction } from '#services/admin_audit_service'
import {
  findImpersonationTarget,
  impersonationSecret,
  listImpersonationTargets,
  togethaAppUrl,
} from '#services/impersonation_service'
import { mintImpersonationToken } from '#services/impersonation_token'
import { CONFIRMATION_PHRASES, confirmationMatches, reasonIsValid } from '#utils/confirmation'
import { impersonateValidator } from '#validators/impersonation'

/**
 * "Log in as a customer".
 *
 * The console never holds a customer session. It mints a signed, 90-second, one-shot
 * token and hands the operator a link into the Togetha app, which completes the login
 * itself (`GET /auth/impersonate` there). The shared secret is the only coupling.
 */
export default class ImpersonationController {
  async targets({ request, params, response }: HttpContext) {
    const connection = request.appEnv()
    const org = await Org.query({ connection }).where('id', params.orgId).firstOrFail()

    return response.ok({ data: await listImpersonationTargets(org, connection) })
  }

  async create(ctx: HttpContext) {
    const { request, params, auth, response } = ctx

    /** Checked first: with no secret there is nothing to validate against. */
    const secret = impersonationSecret()
    if (!secret) {
      return response.serviceUnavailable({ error: 'Impersonation is not configured' })
    }

    const body = await request.validateUsing(impersonateValidator)
    if (!reasonIsValid(body.reason)) {
      return response.badRequest({ error: 'A reason of at least 8 characters is required.' })
    }

    const connection = request.appEnv()
    const admin = auth.getUserOrFail()
    if (connection === 'prod' && !admin.isGodAdmin) {
      return response.forbidden({
        error: 'Only a god admin can sign in as a production customer.',
      })
    }

    const org = await Org.query({ connection }).where('id', params.orgId).firstOrFail()

    /** Scoped to the org, so a user id from elsewhere is indistinguishable from none. */
    const target = await findImpersonationTarget(org, body.userId, connection)
    if (!target) {
      return response.forbidden({ error: 'That user does not belong to this organisation.' })
    }

    const expected = CONFIRMATION_PHRASES['org.impersonate'](target.email)
    if (!confirmationMatches(body.confirmation, expected)) {
      return response.badRequest({
        error: `Type "${expected}" to confirm.`,
        type: 'confirmation',
      })
    }

    const { token, payload } = mintImpersonationToken(secret, {
      sub: target.email,
      uid: target.id,
      org: org.id,
      env: connection,
      by: admin.email,
      reason: body.reason,
    })

    /** The nonce identifies this handoff in both apps' logs; the token itself is never stored. */
    await recordAdminAction(ctx, {
      action: 'org.impersonate',
      appEnv: connection,
      targetType: 'user',
      targetId: target.id,
      targetLabel: target.email,
      reason: body.reason,
      metadata: { orgId: org.id, env: connection, jti: payload.jti },
    })

    const url = `${togethaAppUrl(connection)}/auth/impersonate?token=${encodeURIComponent(token)}`

    return response.ok({ url, expiresAt: new Date(payload.exp * 1000).toISOString() })
  }
}
