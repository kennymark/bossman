import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { getPageAccessForRequest } from '#services/page_access_service'
import { PAGE_KEY_TO_PATH, type PageKey, requiredPageKeyForPath } from '#utils/page_access'

/**
 * Enforces per-member page grants.
 *
 * Pass an explicit `page` for routes whose path does not name the page they serve;
 * otherwise the required grant is derived from the path, which covers both the Inertia
 * page and the `/api/v1` route behind it.
 */
export default class PageAccessMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { page?: PageKey } = {}) {
    const user = ctx.auth.user

    /**
     * Fails closed. This used to `return next()` for anyone who was not an admin, which
     * was only safe because `appRole()` always happens to run first in every group that
     * uses this. Relying on that ordering is one careless route away from a page-gated
     * endpoint being reachable by a signed-in non-admin.
     */
    if (!user) {
      return ctx.request.url().startsWith('/api/')
        ? ctx.response.unauthorized({ error: 'Authentication required' })
        : ctx.response.redirect('/login')
    }

    if (!user.isAdminOrSuperAdmin) {
      return ctx.request.url().startsWith('/api/')
        ? ctx.response.forbidden({ error: 'Access required' })
        : ctx.response.redirect('/login')
    }

    const pathname = ctx.request.url().split('?')[0]?.split('#')[0] || '/'
    const requiredKey = options.page ?? requiredPageKeyForPath(pathname)

    /** Not page-gated — settings, notifications, the user's own audit trail. */
    if (!requiredKey) return next()

    const allowed = await getPageAccessForRequest(ctx)
    if (!allowed || allowed.includes(requiredKey)) return next()

    if (pathname.startsWith('/api/')) {
      return ctx.response.forbidden({ error: 'You do not have access to this page.' })
    }

    const redirectTo = allowed.map((k) => PAGE_KEY_TO_PATH[k]).find(Boolean) || '/dashboard'
    return ctx.response.redirect(redirectTo)
  }
}
