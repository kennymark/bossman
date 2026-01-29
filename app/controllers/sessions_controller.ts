import type { HttpContext } from '@adonisjs/core/http'
import sessionService from '#services/session_service'

export default class SessionsController {
  async index({ auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const sessions = await sessionService.getUserSessions(user.id)
    const deviceSessionId = session.get('deviceSessionId') as string | undefined

    return response.ok({
      sessions: sessions.map((s) => ({
        ...s.serialize(),
        // compute current session per device cookie (not the DB flag)
        isCurrent: deviceSessionId ? s.id === deviceSessionId : Boolean(s.isCurrent),
      })),
    })
  }

  async revoke({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    const body = request.only(['sessionId'])

    if (!body.sessionId) {
      return response.badRequest({ error: 'Session ID is required' })
    }

    await sessionService.revokeSession(body.sessionId, user.id)

    const deviceSessionId = session.get('deviceSessionId') as string | undefined
    if (deviceSessionId && body.sessionId === deviceSessionId) {
      logger.info('Current device session revoked; logging out', { userId: user.id })
      await auth.use('web').logout()
      session.forget('deviceSessionId')
    }

    return response.ok({ message: 'Session revoked successfully' })
  }

  async revokeAll({ auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const deviceSessionId = session.get('deviceSessionId') as string | undefined

    // Delete all sessions for this user except the current device
    if (deviceSessionId) {
      await sessionService.revokeAllSessionsExcept(user.id, deviceSessionId)
    } else {
      // If we don't know the device session id, be safe and revoke all including current
      await sessionService.revokeAllSessionsIncludingCurrent(user.id)
      await auth.use('web').logout()
      session.forget('deviceSessionId')
    }

    return response.ok({ message: 'All sessions revoked successfully' })
  }
}
