import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    const isAdmin = user && (user as { role?: string }).role === 'admin'

    if (!isAdmin) {
      // For API requests, return a 403; for pages, redirect to login.
      if (ctx.request.url().startsWith('/api/')) {
        return ctx.response.forbidden({ error: 'Admin access required' })
      }
      return ctx.response.redirect('/login')
    }

    return next()
  }
}
