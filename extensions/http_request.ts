import { HttpRequest } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import type { QueryParams } from '#utils/vine'
import { validateQueryParams } from '#utils/vine'

type AppEnv = 'dev' | 'prod'

/**
 * The environment resolved by `AppEnvMiddleware` from the authenticated user.
 *
 * There is deliberately no header fallback: trusting an `App-Env` header let any
 * authenticated user point their queries at the production database. When the value
 * is missing (a request that never passed through the middleware) we fail closed to
 * `dev` rather than guessing from client input.
 */
HttpRequest.macro('appEnv', function (this: HttpRequest): AppEnv {
  const resolved = (this as HttpRequest & { _appEnv?: string })._appEnv
  return resolved === 'prod' ? 'prod' : 'dev'
})

HttpRequest.macro('timeZone', function (this: HttpRequest): string {
  const headers = this.headers()
  const timezone = headers['Timezone'] || ''
  return timezone?.toString()
})

HttpRequest.macro('userDateTime', function (this: HttpRequest): DateTime {
  const timezone = this.timeZone()
  const dateTime = DateTime.now().setZone(timezone)
  return dateTime
})

HttpRequest.macro('appDateTime', function (this: HttpRequest): DateTime {
  const timezone = 'Europe/London'

  const dateTime = DateTime.now().setZone(timezone)
  return dateTime
})

HttpRequest.macro('paginationQs', async function (this: HttpRequest) {
  return await validateQueryParams(this.qs())
})

declare module '@adonisjs/core/http' {
  interface HttpRequest {
    appEnv(): AppEnv
    timeZone(): string
    userDateTime(): DateTime
    appDateTime(): DateTime
    paginationQs(): Promise<QueryParams>
    authHeader(data: {}): Record<string, string>
  }
  interface HttpResponse {}
}
