import type { PageKey } from '#utils/page_access'

/**
 * Pure helpers behind global record search. This file is imported by the command
 * palette, so it must stay free of AdonisJS services (see `agent.md`, landmine 1).
 */

export const SEARCH_GROUPS = [
  'orgs',
  'users',
  'tenants',
  'leases',
  'properties',
  'maintenance',
] as const

export type SearchGroup = (typeof SEARCH_GROUPS)[number]

export interface SearchResult {
  group: SearchGroup
  id: string
  title: string
  subtitle: string
  href: string
  badge?: string
}

export interface SearchResponse {
  query: string
  groups: SearchGroup[]
  results: SearchResult[]
}

/**
 * The page grant each group needs. Users and tenants have no page of their own and
 * link to the organisation they belong to, so they follow the `orgs` grant.
 */
export const SEARCH_GROUP_PAGE_KEY: Record<SearchGroup, PageKey> = {
  orgs: 'orgs',
  users: 'orgs',
  tenants: 'orgs',
  leases: 'leases',
  properties: 'properties',
  maintenance: 'maintenance',
}

export const MIN_QUERY_LENGTH = 2
export const MAX_QUERY_LENGTH = 100
export const MAX_TERMS = 8

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SEARCH_GROUP_SET = new Set<string>(SEARCH_GROUPS)

/** Collapses whitespace and caps the length so a pasted document cannot become a query. */
export function normaliseSearchQuery(input: unknown): string {
  return String(input ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .trim()
}

/**
 * Splits a query into the terms a row must match. Single characters carry no trigram
 * signal, so they are dropped; when nothing survives the whole phrase is used instead.
 */
export function searchTerms(input: string): string[] {
  const phrase = normaliseSearchQuery(input)
  if (!phrase) return []

  const terms = phrase
    .split(' ')
    .filter((term) => term.length >= MIN_QUERY_LENGTH)
    .slice(0, MAX_TERMS)

  return terms.length ? terms : [phrase]
}

/** `\`, `%` and `_` are pattern syntax to ILIKE, so a literal search must escape them. */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, (character) => `\\${character}`)
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim())
}

/**
 * Reads the optional `groups` CSV. Unknown names are ignored rather than rejected, so
 * an old client asking for a group that no longer exists still gets the rest; an
 * empty or missing value means every group.
 */
export function parseSearchGroups(csv: string | undefined | null): SearchGroup[] {
  if (!csv) return [...SEARCH_GROUPS]

  const requested = new Set<SearchGroup>()
  for (const raw of csv.split(',')) {
    const name = raw.trim()
    if (SEARCH_GROUP_SET.has(name)) requested.add(name as SearchGroup)
  }

  return requested.size ? SEARCH_GROUPS.filter((group) => requested.has(group)) : []
}

/**
 * Drops the groups a restricted member may not see. `null` is "unrestricted", matching
 * `getPageAccessForUser`.
 */
export function filterSearchGroupsByPageAccess(
  groups: readonly SearchGroup[],
  allowedPages: readonly PageKey[] | null,
): SearchGroup[] {
  if (!allowedPages) return [...groups]

  const allowed = new Set(allowedPages)
  return groups.filter((group) => allowed.has(SEARCH_GROUP_PAGE_KEY[group]))
}

/** Human labels for the palette's result rows. */
export const SEARCH_GROUP_LABELS: Record<SearchGroup, string> = {
  orgs: 'Customer',
  users: 'User',
  tenants: 'Tenant',
  leases: 'Lease',
  properties: 'Property',
  maintenance: 'Maintenance',
}
