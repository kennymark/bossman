import type { HttpContext } from '@adonisjs/core/http'

import { recordAdminAction } from '#services/admin_audit_service'
import { canSwitchEnv } from '#services/app_env_service'
import { updateAppEnvValidator } from '#validators/app_env'

/**
 * Reads and switches the environment the session is pointed at.
 *
 * These two were closure routes until the Tuyau migration. The registry that types the
 * API for the client is built by scanning controller methods for their validator, so a
 * handler defined inline in the routes file can never be typed — it was the only pair
 * of endpoints the frontend had to reach untyped.
 */
export default class AppEnvController {
  async show({ request, response }: HttpContext) {
    return response.ok({ appEnv: request.appEnv() })
  }

  async update(ctx: HttpContext) {
    const { request, session, response, auth } = ctx
    const { appEnv: requestedEnv } = await request.validateUsing(updateAppEnvValidator)
    const user = auth.getUserOrFail()

    /**
     * Only god admins may switch. Everyone else is pinned to the environment their
     * record allows, so asking for one they cannot use is rejected rather than
     * silently downgraded — a silent downgrade previously hid the fact that any
     * user could put 'prod' into their own session.
     */
    if (!canSwitchEnv(user)) {
      return response.forbidden({
        error: 'You are not allowed to change environments.',
        appEnv: request.appEnv(),
      })
    }

    const previous = request.appEnv()
    session.put('appEnv', requestedEnv)

    /** Switching into prod is worth a line in the log, even for a god admin. */
    if (previous !== requestedEnv) {
      await recordAdminAction(ctx, {
        action: 'env.switch',
        appEnv: requestedEnv,
        metadata: { from: previous, to: requestedEnv },
      })
    }

    return response.ok({ message: 'Environment updated successfully', appEnv: requestedEnv })
  }
}
