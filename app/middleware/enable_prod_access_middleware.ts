import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { canAccessProd, canSwitchEnv } from '#services/app_env_service'

/**
 * Shares environment capabilities with Inertia so the sidebar can show or hide the
 * environment switcher.
 *
 * This middleware is presentation only. The environment actually used for queries is
 * decided by `AppEnvMiddleware` via `resolveAppEnv`, so hiding the switcher here is a
 * UI affordance rather than the access control itself.
 */
export default class EnableProdAccessMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    ctx.inertia.share({
      enableProdAccess: canAccessProd(user),
      /** Only god admins can move between dev and prod; prod-only users see only prod. */
      showEnvironmentSwitcher: canSwitchEnv(user),
    })

    await next()
  }
}
