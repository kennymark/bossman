import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { resolveAppEnv } from '#services/app_env_service'
import type { AppEnv } from '#types/env'

/**
 * Resolves the database environment for the request and pins it on the request object
 * so `request.appEnv()` is authoritative.
 *
 * The session value is a *preference*, not a grant: `resolveAppEnv` ignores it for any
 * user who may not switch environments. Request headers are deliberately not consulted —
 * they were previously trusted, which let any authenticated user read production by
 * sending `App-Env: prod`.
 *
 * Must run after session and auth middleware.
 */
export default class AppEnvMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const requested = ctx.session?.get('appEnv') as string | undefined
    const appEnv = resolveAppEnv(ctx.auth?.user, requested)

    ;(ctx.request as { _appEnv?: AppEnv })._appEnv = appEnv

    /** Keep the session in step so the UI never shows an environment the user cannot use. */
    if (ctx.session && requested !== appEnv) ctx.session.put('appEnv', appEnv)

    await next()
  }
}
