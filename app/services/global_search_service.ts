import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import type { RawQueryBindings, StrictValues } from '@adonisjs/lucid/types/querybuilder'

import type { AppEnv } from '#types/env'
import {
  escapeLikePattern,
  isUuid,
  normaliseSearchQuery,
  SEARCH_GROUPS,
  searchTerms,
  type SearchGroup,
  type SearchResult,
} from '#utils/search'

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 20

/** Same threshold the product uses; lower is looser. */
const WORD_SIMILARITY_THRESHOLD = '0.2'

const log = logger.child({ context: 'GlobalSearch' })

type Row = Record<string, unknown>

interface SearchOptions {
  appEnv: AppEnv
  query: string
  groups?: readonly SearchGroup[]
  limitPerGroup?: number
  includeTest?: boolean
}

type SearchMode = 'trigram' | 'ilike' | 'id'

interface GroupBindings {
  /** Values for the match clause, in placeholder order. */
  where: StrictValues[]
  /** Values for ORDER BY, which comes after the shared test-account flag. */
  order: StrictValues[]
}

interface GroupDefinition {
  /**
   * Placeholders run in this order: `where`, the include-test flag, `order`, the
   * limit. `searchGroup` assembles them, so a builder never sees the flag or limit.
   */
  sql: (mode: SearchMode, terms: string[]) => string
  bindings: (mode: SearchMode, terms: string[], phrase: string) => GroupBindings
  /** Trigram groups need the similarity threshold set on the same connection. */
  trigram: boolean
  map: (row: Row) => SearchResult
}

/**
 * Identifier allow-lists. Every column name below is interpolated into SQL, so the
 * lists are fixed here and never derived from the request.
 */
const ORG_COLUMNS = [
  'name',
  'company_name',
  'creator_email',
  'company_email',
  'payment_customer_id',
  'subscription_id',
  'id',
] as const
const USER_COLUMNS = ['name', 'email', 'id'] as const
const TENANT_COLUMNS = ['name', 'email', 'id'] as const

/** `coalesce("t"."a"::text, '') || ' ' || ...` — one ILIKE covers every listed column. */
function document(alias: string, columns: readonly string[]): string {
  return columns.map((column) => `coalesce("${alias}"."${column}"::text, '')`).join(" || ' ' || ")
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function joinParts(...parts: unknown[]): string {
  return parts.map(text).filter(Boolean).join(' · ')
}

/** Hidden test accounts stay hidden unless asked for; rows without an org pass through. */
function testAccountClause(orgAlias: string): string {
  return `(?::boolean OR coalesce("${orgAlias}"."is_test_account", false) = false)`
}

const TRIGRAM_TABLES = {
  leases: 'leases',
  properties: 'leaseable_entities',
  maintenance: 'maintenance_requests',
} as const

/**
 * Builds the WHERE/ORDER for a `<table>_search_text` column: the indexed `<%` operator
 * per term, ordered by `<<->` distance, exactly like the product.
 */
function trigramGroup(
  table: (typeof TRIGRAM_TABLES)[keyof typeof TRIGRAM_TABLES],
  select: string,
  map: (row: Row) => SearchResult,
): GroupDefinition {
  const column = `"t"."${table}_search_text"`

  return {
    trigram: true,
    sql: (mode, terms) => {
      const match =
        mode === 'id' ? `"t"."id"::text = ?` : terms.map(() => `? <% ${column}`).join(' AND ')
      const order = mode === 'id' ? `"t"."created_at" DESC` : `${column} <<-> ?`

      return `
        SELECT ${select}, "o"."name" AS org_name, "o"."is_test_account"
        FROM "${table}" "t"
        LEFT JOIN "orgs" "o" ON "o"."id" = "t"."org_id"
        WHERE ${match} AND ${testAccountClause('o')}
        ORDER BY ${order}
        LIMIT ?
      `
    },
    bindings: (mode, terms, phrase) =>
      mode === 'id' ? { where: [phrase], order: [] } : { where: terms, order: [phrase] },
    map,
  }
}

function ilikeGroup(
  from: string,
  alias: string,
  columns: readonly string[],
  select: string,
  orgAlias: string,
  order: string,
  map: (row: Row) => SearchResult,
): GroupDefinition {
  const doc = document(alias, columns)

  return {
    trigram: false,
    sql: (mode, terms) => {
      const match =
        mode === 'id'
          ? `"${alias}"."id"::text = ?`
          : terms.map(() => `(${doc}) ILIKE ?`).join(' AND ')

      return `
        SELECT ${select}
        FROM ${from}
        WHERE ${match} AND ${testAccountClause(orgAlias)}
        ORDER BY ${order}
        LIMIT ?
      `
    },
    bindings: (mode, terms, phrase) => ({
      where: mode === 'id' ? [phrase] : terms.map((term) => `%${escapeLikePattern(term)}%`),
      order: [],
    }),
    map,
  }
}

const GROUPS: Record<SearchGroup, GroupDefinition> = {
  orgs: ilikeGroup(
    '"orgs" "o"',
    'o',
    ORG_COLUMNS,
    '"o"."id", "o"."name", "o"."company_name", "o"."creator_email", "o"."owner_role", "o"."is_test_account"',
    'o',
    '"o"."created_at" DESC',
    (row) => ({
      group: 'orgs',
      id: text(row.id),
      title: text(row.name) || text(row.company_name) || 'Organisation',
      subtitle: joinParts(row.creator_email, row.company_name !== row.name ? row.company_name : ''),
      href: `/orgs/${text(row.id)}`,
      badge: row.is_test_account ? 'Test' : text(row.owner_role) || undefined,
    }),
  ),

  /**
   * A customer user belongs to the org it created first; the product resolves the
   * "current" org from the session, which does not exist here.
   */
  users: ilikeGroup(
    `"users" "u" LEFT JOIN "orgs" "o" ON "o"."id"::text = "u"."metadata"->>'firstOrgId'`,
    'u',
    USER_COLUMNS,
    '"u"."id", "u"."name", "u"."email", "u"."role", "o"."id" AS org_id, "o"."name" AS org_name, "o"."is_test_account"',
    'o',
    '"u"."created_at" DESC',
    (row) => ({
      group: 'users',
      id: text(row.id),
      title: text(row.name) || text(row.email) || 'User',
      subtitle: joinParts(row.role, row.email, row.org_name),
      href: row.org_id ? `/orgs/${text(row.org_id)}` : '/orgs',
      badge: row.is_test_account ? 'Test' : undefined,
    }),
  ),

  /** Tenants carry no org of their own; the most recent lease decides which org page to open. */
  tenants: ilikeGroup(
    `"tenants" "t"
      LEFT JOIN LATERAL (
        SELECT "l"."org_id", "o"."name", "o"."is_test_account"
        FROM "lease_tenants" "lt"
        JOIN "leases" "l" ON "l"."id" = "lt"."lease_id"
        LEFT JOIN "orgs" "o" ON "o"."id" = "l"."org_id"
        WHERE "lt"."tenant_id" = "t"."id"
        ORDER BY "l"."created_at" DESC
        LIMIT 1
      ) "org" ON true`,
    't',
    TENANT_COLUMNS,
    '"t"."id", "t"."name", "t"."email", "org"."org_id", "org"."name" AS org_name, "org"."is_test_account"',
    'org',
    '"t"."created_at" DESC',
    (row) => ({
      group: 'tenants',
      id: text(row.id),
      title: text(row.name) || text(row.email) || 'Tenant',
      subtitle: joinParts(row.email, row.org_name),
      href: row.org_id ? `/orgs/${text(row.org_id)}` : '/orgs',
      badge: row.is_test_account ? 'Test' : 'tenant',
    }),
  ),

  leases: trigramGroup(
    TRIGRAM_TABLES.leases,
    '"t"."id", "t"."name", "t"."short_id", "t"."status", "t"."archived_at"',
    (row) => ({
      group: 'leases',
      id: text(row.id),
      title: text(row.name) || text(row.short_id) || 'Lease',
      subtitle: joinParts(row.org_name, row.short_id),
      href: `/leases/${text(row.id)}`,
      badge: row.archived_at ? 'archived' : text(row.status) || undefined,
    }),
  ),

  properties: trigramGroup(
    TRIGRAM_TABLES.properties,
    '"t"."id", "t"."address", "t"."summary", "t"."type", "t"."sub_type"',
    (row) => ({
      group: 'properties',
      id: text(row.id),
      title: text(row.address) || text(row.summary) || 'Property',
      subtitle: joinParts(row.org_name, row.address ? row.summary : ''),
      href: `/properties/${text(row.id)}`,
      badge: text(row.sub_type) || text(row.type) || undefined,
    }),
  ),

  maintenance: trigramGroup(
    TRIGRAM_TABLES.maintenance,
    '"t"."id", "t"."title", "t"."status", "t"."severity", "t"."type"',
    (row) => ({
      group: 'maintenance',
      id: text(row.id),
      title: text(row.title) || 'Maintenance request',
      subtitle: joinParts(row.org_name, row.severity, row.type),
      href: `/maintenance/${text(row.id)}`,
      badge: text(row.status) || undefined,
    }),
  ),
}

/**
 * Record search for the header search field.
 *
 * Reads the customer database for `appEnv` only, with bound values and allow-listed
 * identifiers. Each group is queried independently and a failing group — typically a
 * table without its `<table>_search_text` column yet — is logged and returns nothing
 * rather than failing the whole search.
 */
export default class GlobalSearchService {
  static async search({
    appEnv,
    query,
    groups = SEARCH_GROUPS,
    limitPerGroup = DEFAULT_LIMIT,
    includeTest = false,
  }: SearchOptions): Promise<SearchResult[]> {
    const phrase = normaliseSearchQuery(query)
    const terms = searchTerms(phrase)
    if (!terms.length || !groups.length) return []

    const limit = Math.min(Math.max(Math.trunc(limitPerGroup) || DEFAULT_LIMIT, 1), MAX_LIMIT)
    const exactId = isUuid(phrase)

    const settled = await Promise.allSettled(
      groups.map((group) =>
        this.searchGroup(group, {
          appEnv,
          phrase: exactId ? phrase.toLowerCase() : phrase,
          terms,
          exactId,
          includeTest,
          limit,
        }),
      ),
    )

    return settled.flatMap((result, position) => {
      if (result.status === 'fulfilled') return result.value

      /**
       * Pino only serialises the error when it sits in the merging object. The group
       * name is what an operator needs to tell "no matches" from "index missing".
       */
      log.warn({ err: result.reason, group: groups[position], appEnv }, 'Search group failed')
      return []
    })
  }

  private static async searchGroup(
    group: SearchGroup,
    input: {
      appEnv: AppEnv
      phrase: string
      terms: string[]
      exactId: boolean
      includeTest: boolean
      limit: number
    },
  ): Promise<SearchResult[]> {
    const definition = GROUPS[group]
    const mode = input.exactId ? 'id' : definition.trigram ? 'trigram' : 'ilike'
    const sql = definition.sql(mode, input.terms)
    const { where, order } = definition.bindings(mode, input.terms, input.phrase)
    const bindings: RawQueryBindings = [...where, input.includeTest, ...order, input.limit]

    const rows = await this.runQuery(input.appEnv, sql, bindings, mode === 'trigram')

    return rows.map((row) => definition.map(row))
  }

  /**
   * `<%` and `<<->` read `pg_trgm.word_similarity_threshold` from the session. Lucid
   * pools connections, so a `set_config` sent as its own statement can land on a
   * different connection from the query that follows — and with `is_local = true`
   * outside a transaction it is discarded as soon as its own statement commits.
   * Running both inside one short transaction is the only arrangement that guarantees
   * the threshold applies to the query. The transaction is rolled back because it
   * never writes.
   */
  private static async runQuery(
    appEnv: AppEnv,
    sql: string,
    bindings: RawQueryBindings,
    trigram: boolean,
  ): Promise<Row[]> {
    if (!trigram) {
      const result = await db.connection(appEnv).rawQuery(sql, bindings)
      return (result.rows ?? []) as Row[]
    }

    const trx = await db.connection(appEnv).transaction()
    try {
      await trx.rawQuery(`SELECT set_config('pg_trgm.word_similarity_threshold', ?, true)`, [
        WORD_SIMILARITY_THRESHOLD,
      ])
      const result = await trx.rawQuery(sql, bindings)
      return (result.rows ?? []) as Row[]
    } finally {
      await trx.rollback()
    }
  }
}
