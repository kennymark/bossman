import logger from '@adonisjs/core/services/logger'
import type { Emails } from '@adonisjs/core/types'
import type { Message } from '@adonisjs/mail'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

const NO_REPLY_EMAIL = env.get('NO_REPLY_EMAIL', 'do_not_reply@togetha.co.uk')
const FROM_EMAIL = env.get('FROM_EMAIL', 'hello@togetha.co.uk')

type EmailHandlerFunction<T extends keyof Emails = keyof Emails> = (
  message: Message,
  data: Emails[T],
  options: Record<string, unknown>,
) => Promise<void>

type SendEmailParams<T extends keyof Emails> = {
  type: T
  data: Emails[T]
  options?: Record<string, unknown>
}

class EmailService {
  public listeners = new Map<keyof Emails, EmailHandlerFunction>()

  /**
   * Registers a handler function for a specific email type.
   */
  on<T extends keyof Emails>({
    type,
    handler,
  }: {
    type: T
    handler: EmailHandlerFunction<T>
  }): void {
    this.listeners.set(type, handler as EmailHandlerFunction)
  }

  /**
   * Sends an email by delegating to the registered handler for the given type.
   * Logs success or failure.
   */
  async send<T extends keyof Emails>({ type, data, options = {} }: SendEmailParams<T>) {
    const handler = this.listeners.get(type) as EmailHandlerFunction<T> | undefined
    if (!handler) {
      throw new Error(`No handler registered for email type: ${String(type)}`)
    }

    const commonLogInfo: Record<string, any> = {
      type,
      from: NO_REPLY_EMAIL,
      replyTo: FROM_EMAIL,
    }

    // Add recipient info if available
    if ('email' in data) {
      commonLogInfo.to = data.email
      // if (isFakeEmail(data.email)) {
      //   console.log('Skipping email for fake email', data.email)
      //   return
      // }
    }
    // Add subject if available
    if ('subject' in data) {
      commonLogInfo.subject = data.subject
    }

    const sendMail = async () => {
      const isDevelopment = env.get('NODE_ENV') === 'development'

      if (isDevelopment) {
        await mail.send(async (message) => {
          await Promise.resolve(handler(message, data, options))
        })
      } else {
        await mail.sendLater(async (message) => {
          await Promise.resolve(handler(message, data, options))
        })
      }
    }

    try {
      logger.debug('Preparing to send email', { type, data })

      await sendMail()

      logger.info(`Email queued successfully: ${type}`, commonLogInfo)
    } catch (error) {
      console.log('Failed to queue email', error)
      logger.error(`Failed to queue email: ${type}`, { ...commonLogInfo, error })
      throw error
    }
  }
}

const mailer = new EmailService()

export default mailer
