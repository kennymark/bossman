import type { Emails as CoreEmails } from '@adonisjs/core/types'

export type Emails = CoreEmails

export type MailerService = {
  send: <T extends keyof Emails>(
    type: T,
    data: Emails[T],
    options?: Record<string, unknown>,
  ) => Promise<void>
}
