import type { HttpContext } from '@adonisjs/core/http'
import type { Resolver } from '@stouder-io/adonis-auditing'

export default class IpAddressResolver implements Resolver {
  async resolve(ctx: HttpContext) {
    return ctx.request.ip()
  }
}
