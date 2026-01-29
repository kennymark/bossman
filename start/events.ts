import string from '@adonisjs/core/helpers/string'
import emitter from '@adonisjs/core/services/emitter'
import logger from '@adonisjs/core/services/logger'
import UserListener from '#listeners/user'

emitter.on('user:created', [UserListener, 'userCreated'])
emitter.on('user:deleted', [UserListener, 'userDeleted'])

emitter.on('db:connection:connect', (connectionName) => {
  console.log(`Database connection "${connectionName.clientName}" is now established.`)
})

emitter.on('db:connection:disconnect', (connectionName) => {
  console.log(`Database connection "${connectionName.clientName}" has been closed.`)
})

emitter.on('http:request_completed', (event) => {
  const method = event.ctx.request.method()
  const url = event.ctx.request.url()
  const duration = event.duration

  if (!url.includes('/api/v1')) return

  logger.info(`${method} ${url} [${string.prettyHrTime(duration)}]`)
})

emitter.on('mail:sent', async (event) => {
  // @ts-expect-error
  const responseString = event.response.original.response as unknown as string
  const testMessageUrl = getTestMessageUrl(responseString)
  const msg = {
    subject: event.message.subject,
    from: event.message.from,
    to: event.message.to,
    url: testMessageUrl,
  }

  console.log('Mail sent:', msg)
})

const getTestMessageUrl = (info: string) => {
  const web = 'https://ethereal.email/message'
  // given this response, extract the MSGID
  const msgIdRegex = /MSGID=([^ ]+)/
  const msgIdMatch = info.match(msgIdRegex)
  const msgId = msgIdMatch ? msgIdMatch[1] : null
  if (msgId) {
    // Clean the MSGID by removing any trailing characters like ']' and trimming whitespace
    const cleanMsgId = msgId.replace(/[\]\s]+$/, '').trim()
    return `${web}/${cleanMsgId}`
  }
  return `No MSGID found in response`
}

emitter.onError((error) => logger.error(error))
