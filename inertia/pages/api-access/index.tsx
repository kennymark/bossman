import {
  IconAlertTriangle,
  IconApps,
  IconBuilding,
  IconClockHour4,
  IconKey,
  IconPlugConnected,
  IconShieldLock,
  IconUsers,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'

import { timeAgo } from '#utils/date'
import { formatNumber } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { StatCard } from '@/components/dashboard/stat-card'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { SimpleGrid } from '@/components/ui/simplegrid'
import api from '@/lib/http'

interface ApplicationRow {
  client: string
  tokens: number
  active: number
  lastUsedAt: string | null
}

interface ScopeRow {
  scope: string
  tokens: number
}

interface TokenRow {
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

interface ApiAccessStats {
  totals: {
    total: number
    active: number
    expired: number
    usedLast7Days: number
    createdLast30Days: number
    users: number
    applications: number
    connectedOrgs: number
  }
  byApplication: ApplicationRow[]
  byScope: ScopeRow[]
  recent: TokenRow[]
  unavailable?: boolean
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  read: 'Read properties, tenancies, sales, maintenance, finance, contacts and tasks',
  write: 'Create notes, tasks and maintenance requests, and update maintenance status',
  mcp: 'Connect an AI agent to the workspace over MCP',
}

function relative(value: string | null) {
  return value ? timeAgo(value) : 'Never'
}

/**
 * Togetha Connect oversight.
 *
 * One access token authenticates both the REST API and the MCP server, so the
 * token table is the whole picture: which applications are connected, what they
 * are allowed to do, and which workspaces they reach.
 */
export default function ApiAccessPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['api-access-stats'],
    queryFn: async () => (await api.get<ApiAccessStats>('/api-access/stats')).data,
  })

  const totals = data?.totals

  return (
    <DashboardPage
      title='API & MCP access'
      description='Applications connected through Togetha Connect, and the access tokens they hold.'>
      {data?.unavailable && (
        <AppCard title='Not available here'>
          <div className='flex items-center gap-3 text-sm text-muted-foreground'>
            <IconAlertTriangle className='h-4 w-4 text-amber-500' />
            No token table in this environment yet. Deploy Togetha Connect here to see data.
          </div>
        </AppCard>
      )}

      <SimpleGrid cols={4}>
        <StatCard
          title='Applications'
          description='Connected via Togetha Connect'
          value={isLoading ? '—' : formatNumber(totals?.applications ?? 0)}
          icon={IconApps}
        />
        <StatCard
          title='Access tokens'
          description='Issued in total'
          value={isLoading ? '—' : formatNumber(totals?.total ?? 0)}
          icon={IconKey}
        />
        <StatCard
          title='Active tokens'
          description='Not yet expired'
          value={isLoading ? '—' : formatNumber(totals?.active ?? 0)}
          icon={IconShieldLock}
        />
        <StatCard
          title='Workspaces'
          description='Organisations with a token'
          value={isLoading ? '—' : formatNumber(totals?.connectedOrgs ?? 0)}
          icon={IconBuilding}
        />
      </SimpleGrid>

      <SimpleGrid cols={4}>
        <StatCard
          title='Used this week'
          description='Tokens seen in last 7 days'
          value={isLoading ? '—' : formatNumber(totals?.usedLast7Days ?? 0)}
          icon={IconClockHour4}
        />
        <StatCard
          title='New this month'
          description='Created in last 30 days'
          value={isLoading ? '—' : formatNumber(totals?.createdLast30Days ?? 0)}
          icon={IconPlugConnected}
        />
        <StatCard
          title='People'
          description='Users holding a token'
          value={isLoading ? '—' : formatNumber(totals?.users ?? 0)}
          icon={IconUsers}
        />
        <StatCard
          title='Expired'
          description='Past their expiry date'
          value={isLoading ? '—' : formatNumber(totals?.expired ?? 0)}
          icon={IconAlertTriangle}
        />
      </SimpleGrid>

      <div className='grid gap-6 lg:grid-cols-2'>
        <AppCard title='By application' description='Which apps hold tokens'>
          {isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading…</p>
          ) : data?.byApplication.length ? (
            <div className='divide-y'>
              {data.byApplication.map((row) => (
                <div key={row.client} className='flex items-center justify-between gap-3 py-3'>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>{row.client}</p>
                    <p className='text-xs text-muted-foreground'>
                      Last used {relative(row.lastUsedAt)}
                    </p>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <Badge variant='secondary'>{formatNumber(row.active)} active</Badge>
                    <Badge variant='outline'>{formatNumber(row.tokens)} total</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>No applications have tokens yet.</p>
          )}
        </AppCard>

        <AppCard title='By scope' description='What those tokens are allowed to do'>
          {isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading…</p>
          ) : data?.byScope.length ? (
            <div className='divide-y'>
              {data.byScope.map((row) => (
                <div key={row.scope} className='flex items-start justify-between gap-3 py-3'>
                  <div className='min-w-0'>
                    <p className='text-sm font-medium'>{row.scope}</p>
                    <p className='text-xs text-muted-foreground'>
                      {SCOPE_DESCRIPTIONS[row.scope] ?? 'Custom scope'}
                    </p>
                  </div>
                  <Badge variant='secondary' className='shrink-0'>
                    {formatNumber(row.tokens)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>No scopes recorded yet.</p>
          )}
        </AppCard>
      </div>

      <AppCard title='Recent tokens' description='The 25 most recently issued'>
        {isLoading ? (
          <p className='text-sm text-muted-foreground'>Loading…</p>
        ) : data?.recent.length ? (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b text-left text-xs uppercase tracking-wider text-muted-foreground'>
                  <th className='py-2 pr-4 font-medium'>Token</th>
                  <th className='py-2 pr-4 font-medium'>User</th>
                  <th className='py-2 pr-4 font-medium'>Workspace</th>
                  <th className='py-2 pr-4 font-medium'>Scopes</th>
                  <th className='py-2 pr-4 font-medium'>Created</th>
                  <th className='py-2 pr-4 font-medium'>Last used</th>
                  <th className='py-2 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {data.recent.map((token) => (
                  <tr key={token.id}>
                    <td className='py-3 pr-4'>
                      <p className='font-medium'>{token.name ?? 'Unnamed'}</p>
                      {token.client && (
                        <p className='text-xs text-muted-foreground'>{token.client}</p>
                      )}
                    </td>
                    <td className='py-3 pr-4'>
                      <p>{token.userName ?? '—'}</p>
                      {token.userEmail && (
                        <p className='text-xs text-muted-foreground'>{token.userEmail}</p>
                      )}
                    </td>
                    <td className='py-3 pr-4'>{token.orgName ?? token.orgId ?? '—'}</td>
                    <td className='py-3 pr-4'>
                      <div className='flex flex-wrap gap-1'>
                        {token.scopes.length ? (
                          token.scopes.map((scope) => (
                            <Badge key={scope} variant='outline'>
                              {scope}
                            </Badge>
                          ))
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </div>
                    </td>
                    <td className='py-3 pr-4 text-muted-foreground'>{relative(token.createdAt)}</td>
                    <td className='py-3 pr-4 text-muted-foreground'>
                      {relative(token.lastUsedAt)}
                    </td>
                    <td className='py-3'>
                      <Badge variant={token.isExpired ? 'destructive' : 'secondary'}>
                        {token.isExpired ? 'Expired' : 'Active'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No tokens issued yet.</p>
        )}
      </AppCard>
    </DashboardPage>
  )
}
