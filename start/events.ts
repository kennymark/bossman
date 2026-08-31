import string from '@adonisjs/core/helpers/string'
import emitter from '@adonisjs/core/services/emitter'
import logger from '@adonisjs/core/services/logger'

import '#boss/base'
import UserListener from '#listeners/user'

emitter.on('user:created', [UserListener, 'userCreated'])
emitter.on('user:deleted', [UserListener, 'userDeleted'])
emitter.on('new:custom-user', [UserListener, 'newCustomUser'])

// Fires once per HTTP request when the session is written. Frequent commits usually
// come from polling (e.g. server-stats bar, debug panel, Transmit). See config/server_stats
// intervalMs and session_activity_middleware SKIP_ACTIVITY_PATHS to reduce noise.
// emitter.on('session:committed', () => {
//   console.log(`Session committed: ${Date.now()}`)
// })

emitter.on('db:connection:connect', (connectionName) => {
  logger.info(`Database connection "${connectionName.clientName}" is now established.`)
})

emitter.on('db:connection:disconnect', (connectionName) => {
  logger.info(`Database connection "${connectionName.clientName}" has been closed.`)
})

// emitter.on('http:request_completed', (event) => {
//   const method = event.ctx.request.method()
//   const url = event.ctx.request.url()
//   const duration = event.duration

//   if (!url.includes('/api/v1')) return

//   logger.info(`${method} ${url} [${string.prettyHrTime(duration)}]`)
// })

emitter.on('mail:sent', (event) => {
  const msg: Record<string, unknown> = {
    subject: event.message.subject,
    from: event.message.from,
    to: event.message.to,
  }

  /**
   * The Ethereal preview link is a development convenience and only exists on the SMTP
   * transport's response. This used to reach into `response.original.response`
   * unconditionally and regex it, so on any real transport the value was `undefined`
   * and the listener threw on every single mail sent — swallowed by `emitter.onError`,
   * and therefore invisible.
   */
  const previewUrl = getTestMessageUrl(event)
  if (previewUrl) msg.url = previewUrl

  logger.debug({ msg }, 'Mail sent')
})

/** Ethereal preview URL, when the transport actually returned an SMTP MSGID. */
const getTestMessageUrl = (event: unknown): string | null => {
  const response = (event as { response?: { original?: { response?: unknown } } })?.response
    ?.original?.response

  if (typeof response !== 'string') return null

  const msgId = response.match(/MSGID=([^ ]+)/)?.[1]
  if (!msgId) return null

  // Clean the MSGID by removing any trailing characters like ']' and trimming whitespace
  return `https://ethereal.email/message/${msgId.replace(/[\]\s]+$/, '').trim()}`
}

emitter.onError((error) => logger.error(error))
