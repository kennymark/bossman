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
    if (!user?.isAdminOrSuperAdmin) return next()

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
