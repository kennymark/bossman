import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import sessionService from '#services/session_service'

/**
 * Middleware to update the last activity timestamp for the current session
 */
export default class SessionActivityMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Only enforce/update if user is authenticated
    if (ctx.auth.user) {
      const userId = ctx.auth.user.id
      const ipAddress = ctx.request.ip()
      const userAgent = ctx.request.header('user-agent') || null

      let deviceSessionId = ctx.session.get('deviceSessionId') as string | undefined

      // Backwards compat: if missing, attach a new device session id and create a row
      if (!deviceSessionId) {
        deviceSessionId = randomUUID()
        ctx.session.put('deviceSessionId', deviceSessionId)
        await sessionService.createOrUpdateSession({
          deviceSessionId,
          userId,
          ipAddress,
          userAgent,
          lastActivity: DateTime.now(),
        })
      } else {
        const exists = await sessionService.sessionExists(deviceSessionId, userId)
        if (!exists) {
          // Session was revoked elsewhere; force logout
          await ctx.auth.use('web').logout()
          ctx.session.forget('deviceSessionId')

          if (ctx.request.url().startsWith('/api/')) {
            return ctx.response.unauthorized({ error: 'Session revoked' })
          }

          return ctx.response.redirect('/login')
        }
      }
    }

    await next()

    // Update activity after the request completes
    if (ctx.auth.user) {
      const userId = ctx.auth.user.id
      const deviceSessionId = ctx.session.get('deviceSessionId') as string | undefined

      if (deviceSessionId) {
        await sessionService.updateActivityById(deviceSessionId, userId)
      } else {
        await sessionService.updateActivity({
          userId,
          ipAddress: ctx.request.ip(),
          userAgent: ctx.request.header('user-agent') || null,
        })
      }
    }
  }
}
