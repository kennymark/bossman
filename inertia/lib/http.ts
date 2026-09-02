import { createTuyau } from '@tuyau/core/client'

import type { PaginationMeta } from '#types/extra'

import { registry } from '../../.adonisjs/client/registry/index.ts'

/**
 * The typed API client.
 *
 * This replaces a hand-rolled `refresh:routes` ace command that stringified the
 * router and regexed URL patterns out of it into a `string` union. That union only
 * ever checked the URL, could not see params, body, query or response, and silently
 * missed any route its regex did not match — several call sites carried
 * `as Parameters<typeof api.get>[0]` casts to work around exactly that.
 *
 * Tuyau generates `.adonisjs/client/registry` from the real router at build time, so
 * every endpoint is reached by its route name and typed end to end against the
 * controller that serves it.
 *
 * Two behavioural differences from the axios client this replaces:
 *
 * - A call resolves to the parsed body, not an axios envelope. `res.data` is now just
 *   `res`, and a `{ data: T }` payload is reached as `res.data` because the *server*
 *   nests it, not because the client wrapped it.
 * - A non-2xx response throws `TuyauHTTPError`, whose `.response` holds the parsed
 *   error body — the axios `err.response.data` equivalent.
 */
export const tuyau = createTuyau({
  registry,
  baseUrl: window.location.origin,

  /** Session cookie; the app authenticates every API call with it. */
  credentials: 'include',

  headers: {
    'X-Device-Type': 'web',
    Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },

  /**
   * ky retries idempotent requests twice by default. These endpoints back a UI that
   * reports its own failures, and a silent retry only delays that report.
   */
  retry: 0,
})

/**
 * The endpoint tree, keyed by route name: `api.dbBackups.health({})`.
 *
 * Reach for `tuyau` itself when you need `urlFor` or `getRoute` instead of a request.
 */
const api = tuyau.api

export default api

/**
 * The wire shape of a Lucid paginator.
 *
 * A controller that returns `Model.query().paginate(...)` sends `{ data, meta }` over
 * the wire, but its inferred return type is the paginator object — which exposes
 * `all()` and `getMeta()` and has no `data` field at all. Tuyau reads the controller's
 * type, so it inherits that mismatch. This maps the type back to what the client
 * actually receives, deriving the row type from the controller rather than restating
 * it by hand.
 *
 * The mismatch is on the server: these endpoints would need to return
 * `paginator.serialize()` (or a transformer) for the inferred type to be right, which
 * is a wider change than this alias.
 */
export type Paginated<T> = T extends { all(): (infer Row)[] }
  ? { data: Row[]; meta: PaginationMeta }
  : T

/**
 * Page and size as the query string carries them.
 *
 * The pagination query rules are strings, because that is what a URL holds and what
 * the controllers coerce on arrival; this keeps the conversion in one place rather
 * than at every paginated call site.
 */
export function pageQuery(page: number, perPage: number) {
  return { page: String(page), perPage: String(perPage) }
}

/** Reads a paginator-typed response as the `{ data, meta }` the server actually sent. */
export function paginated<T>(value: T): Paginated<T> {
  return value as unknown as Paginated<T>
}
