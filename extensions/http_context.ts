import { HttpContext } from '@adonisjs/core/http'
import type { Emails } from '@adonisjs/core/types'
import type { CookieOptions } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'
import mailer from '#services/email_service'

import type { MailerService } from '#types/mails'

HttpContext.getter('mailer', function (this: HttpContext) {
  return {
    send: <T extends keyof Emails>(type: T, data: Emails[T], options?: Record<string, unknown>) => {
      return mailer.send({ type, data, options })
    },
  }
})

HttpContext.getter('now', function (this: HttpContext) {
  return DateTime.now()
})

HttpContext.getter('cookie', function (this: HttpContext) {
  return {
    get: (key: string, defaultValue?: string) => this.request.cookie(key, defaultValue),
    set: (key: string, value: any, options?: CookieOptions & { encode: boolean }) =>
      this.response.plainCookie(key, value, {
        httpOnly: false,
        secure: false,
        encode: false,
        ...options,
      }),
    clear: (key: string) => this.response.clearCookie(key),
  }
})

declare module '@adonisjs/core/http' {
  interface HttpContext {
    mailer: MailerService
    now: DateTime
    cookie: {
      get: (key: string, defaultValue?: string) => string | undefined
      set: (key: string, value: string, options?: CookieOptions & { encode: boolean }) => void
      clear: (key: string) => void
    }

    // jobScheduler: {
    //   now: ({ name, data }: NowJob) => Promise<void>
    //   scheduleForLater: ({ name, when, data }: LaterJob) => Promise<void>
    // }
  }
}
