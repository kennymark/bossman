import type { Authenticators } from '@adonisjs/auth/types'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {},
  ) {
    /**
     * An unauthenticated API call gets a 401, not a redirect to the login page.
     *
     * `authenticateUsing` redirects for everything, so an expired session on an XHR
     * request answered `200` with the login page's HTML — the client saw a success and
     * had no way to tell it needed to sign in again. The page routes still redirect,
     * which is what a browser navigation wants; `appRole` and `pageAccess` already draw
     * the same distinction.
     */
    if (ctx.request.url().startsWith('/api/') && !(await ctx.auth.check())) {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }

    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })
    return next()
  }
}
