import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { getAdminPageAccessForUser } from '#services/admin_access_service'
import { ADMIN_PAGE_KEY_TO_PATH, requiredAdminPageKeyForPath } from '#utils/admin_pages'

export default class AdminPageAccessMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    const isAdmin = user && (user as { role?: string }).role === 'admin'

    // This middleware is only meant to run for admin users/routes.
    if (!isAdmin || !user) return next()

    const rawUrl = String(ctx.request.url() || '/')
    const pathname = rawUrl.split('?')[0]?.split('#')[0] || '/'

    const allowed = await getAdminPageAccessForUser(user.id)
    // Unrestricted admins
    if (!allowed) return next()

    const requiredKey = requiredAdminPageKeyForPath(pathname)
    if (allowed.includes(requiredKey)) return next()

    const redirectTo = allowed.map((k) => ADMIN_PAGE_KEY_TO_PATH[k]).find(Boolean) || '/dashboard'

    if (ctx.request.url().startsWith('/api/')) {
      return ctx.response.forbidden({ error: 'You do not have access to this page.' })
    }

    return ctx.response.redirect(redirectTo)
  }
}
