import db from '@adonisjs/lucid/services/db'

/**
 * Reporting over Togetha Connect access tokens.
 *
 * Tokens carry their context in the `abilities` array the auth module stores as
 * JSON text - `client:<id>`, `scope:<name>` and `org:<id>` - so applications,
 * permissions and workspaces are all derived from that one column.
 */

/** Only rows whose abilities actually parse as a JSON array are aggregated. */
const JSON_ABILITIES = `t.abilities LIKE '[%'`

export interface TokenRow {
  id: number
  name: string | null
  client: string | null
  scopes: string[]
  orgId: string | null
  orgName: string | null
  userName: string | null
  userEmail: string | null
  createdAt: string | null
  lastUsedAt: string | null
  expiresAt: string | null
  isExpired: boolean
}

function parseAbilities(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw !== 'string') return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function prefixed(abilities: string[], prefix: string) {
  return abilities.filter((a) => a.startsWith(prefix)).map((a) => a.slice(prefix.length))
}

class ApiAccessService {
  /**
   * Headline counts across every token in the environment.
   */
  async totals(connection: string) {
    const result = await db.connection(connection).rawQuery(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE expires_at IS NULL OR expires_at > now())::int AS active,
        COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= now())::int AS expired,
        COUNT(*) FILTER (WHERE last_used_at > now() - interval '7 days')::int AS used_last_7_days,
        COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS created_last_30_days,
        COUNT(DISTINCT tokenable_id)::int AS users
      FROM auth_access_tokens
    `)

    const row = result.rows[0] ?? {}

    return {
      total: Number(row.total ?? 0),
      active: Number(row.active ?? 0),
      expired: Number(row.expired ?? 0),
      usedLast7Days: Number(row.used_last_7_days ?? 0),
      createdLast30Days: Number(row.created_last_30_days ?? 0),
      users: Number(row.users ?? 0),
    }
  }

  /**
   * Tokens grouped by the application that requested them.
   */
  async byApplication(connection: string) {
    const result = await db.connection(connection).rawQuery(`
      SELECT
        substring(a FROM 8) AS client,
        COUNT(*)::int AS tokens,
        COUNT(*) FILTER (WHERE t.expires_at IS NULL OR t.expires_at > now())::int AS active,
        MAX(t.last_used_at) AS last_used_at
      FROM auth_access_tokens t,
           json_array_elements_text(t.abilities::json) AS a
      WHERE ${JSON_ABILITIES} AND a LIKE 'client:%'
      GROUP BY 1
      ORDER BY 2 DESC
    `)

    return result.rows.map((row: Record<string, unknown>) => ({
      client: String(row.client),
      tokens: Number(row.tokens ?? 0),
      active: Number(row.active ?? 0),
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string).toISOString() : null,
    }))
  }

  /**
   * How many tokens carry each scope. A token counts once per scope it holds.
   */
  async byScope(connection: string) {
    const result = await db.connection(connection).rawQuery(`
      SELECT substring(a FROM 7) AS scope, COUNT(*)::int AS tokens
      FROM auth_access_tokens t,
           json_array_elements_text(t.abilities::json) AS a
      WHERE ${JSON_ABILITIES} AND a LIKE 'scope:%'
      GROUP BY 1
      ORDER BY 2 DESC
    `)

    return result.rows.map((row: Record<string, unknown>) => ({
      scope: String(row.scope),
      tokens: Number(row.tokens ?? 0),
    }))
  }

  /**
   * How many distinct organisations have at least one token.
   */
  async connectedOrgs(connection: string) {
    const result = await db.connection(connection).rawQuery(`
      SELECT COUNT(DISTINCT substring(a FROM 5))::int AS orgs
      FROM auth_access_tokens t,
           json_array_elements_text(t.abilities::json) AS a
      WHERE ${JSON_ABILITIES} AND a LIKE 'org:%'
    `)

    return Number(result.rows[0]?.orgs ?? 0)
  }

  /**
   * The most recently issued tokens, resolved to the person and workspace they
   * belong to.
   */
  async recent(connection: string, limit = 25): Promise<TokenRow[]> {
    const conn = db.connection(connection)

    const result = await conn.rawQuery(
      `
      SELECT t.id, t.name, t.abilities, t.created_at, t.last_used_at, t.expires_at,
             u.name AS user_name, u.email AS user_email
      FROM auth_access_tokens t
      LEFT JOIN users u ON u.id = t.tokenable_id
      ORDER BY t.created_at DESC
      LIMIT ?
    `,
      [limit],
    )

    const rows = result.rows.map((row: Record<string, unknown>) => {
      const abilities = parseAbilities(row.abilities)
      const expiresAt = row.expires_at ? new Date(row.expires_at as string) : null

      return {
        id: Number(row.id),
        name: (row.name as string) ?? null,
        client: prefixed(abilities, 'client:')[0] ?? null,
        scopes: prefixed(abilities, 'scope:'),
        orgId: prefixed(abilities, 'org:')[0] ?? null,
        orgName: null as string | null,
        userName: (row.user_name as string) ?? null,
        userEmail: (row.user_email as string) ?? null,
        createdAt: row.created_at ? new Date(row.created_at as string).toISOString() : null,
        lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string).toISOString() : null,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        isExpired: Boolean(expiresAt && expiresAt.getTime() <= Date.now()),
      }
    })

    /** Resolve workspace names in one extra query rather than a join per row. */
    const orgIds = [...new Set(rows.map((r: TokenRow) => r.orgId).filter(Boolean))] as string[]

    if (orgIds.length) {
      const orgs = await conn.rawQuery(`SELECT id, name FROM orgs WHERE id = ANY(?)`, [orgIds])
      const names = new Map<string, string>(
        orgs.rows.map((o: Record<string, unknown>) => [String(o.id), String(o.name)]),
      )

      for (const row of rows) {
        if (row.orgId) row.orgName = names.get(row.orgId) ?? null
      }
    }

    return rows
  }
}

export default new ApiAccessService()
