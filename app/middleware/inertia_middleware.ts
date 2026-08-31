import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

import { getPageAccessForRequest } from '#services/page_access_service'
import env from '#start/env'
import UserTransformer from '#transformers/user_transformer'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  async share(ctx: HttpContext) {
    const { session, auth } = ctx
    const user = ctx.auth?.user
    /** Shares the per-request cache with PageAccessMiddleware, so this costs no extra query. */
    const pageAccess = user?.isAdminOrSuperAdmin ? await getPageAccessForRequest(ctx) : null
    const qs = { ...ctx.request.qs(), ...(await ctx.request?.paginationQs()) }
    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      flash: ctx.inertia.always({
        error: session?.flashMessages.get('error'),
        success: session?.flashMessages.get('success'),
      }),
      user: ctx.inertia.always(user ? UserTransformer.transform(user) : undefined),
      /** Resolved from the user by AppEnvMiddleware, not read raw from the session. */
      appEnv: ctx.request.appEnv(),
      isDev: env.get('NODE_ENV') === 'development',
      /**
       * A few screens gate an action on this rather than on a page grant — restoring
       * into production, for instance. The server checks it again; this only decides
       * what the UI offers.
       */
      isGodAdmin: ctx.inertia.always(Boolean(user?.isGodAdmin)),
      /** Surfaced so the UI can warn before a production grant lapses. */
      prodAccessExpiresAt: user?.prodAccessExpiresAt?.toISO() ?? null,
      pageAccess: ctx.inertia.always(pageAccess ?? undefined),
      params: ctx.request.params(),
      qs,
      isLoggedIn: ctx.inertia.always(ctx.auth?.isAuthenticated ?? false),
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)
    const output = await next()
    this.dispose(ctx)
    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = Awaited<ReturnType<InertiaMiddleware['share']>>
  export interface SharedProps extends MiddlewareSharedProps {}
}
