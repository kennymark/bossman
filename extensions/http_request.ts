import { Request } from '@adonisjs/core/http'
import type { CookieOptions } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'
import type { QueryParams } from '#utils/vine'
import { validateQueryParams } from '#utils/vine'

Request.macro('timeZone', function (this: Request): string {
  const headers = this.headers()
  const timezone = headers['Timezone'] || ''
  return timezone?.toString()
})

Request.macro('userDateTime', function (this: Request): DateTime {
  const timezone = this.timeZone()
  const dateTime = DateTime.now().setZone(timezone)
  return dateTime
})

Request.macro('appDateTime', function (this: Request): DateTime {
  const timezone = 'Europe/London'

  const dateTime = DateTime.now().setZone(timezone)
  return dateTime
})

Request.macro('paginationQs', async function (this: Request) {
  return await validateQueryParams(this.qs())
})

declare module '@adonisjs/core/http' {
  interface Request {
    timeZone(): string
    userDateTime(): DateTime
    appDateTime(): DateTime
    paginationQs(): Promise<QueryParams>
    authHeader(data: {}): Record<string, string>
  }
  interface Response {
    setCookie(
      name: string,
      value: string,
      options?: Partial<CookieOptions & { encode: boolean }>,
    ): void
  }
}
