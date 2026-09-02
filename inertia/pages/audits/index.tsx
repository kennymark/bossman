import type { SharedProps } from '@adonisjs/inertia/types'
import { Head } from '@inertiajs/react'
import { IconShieldCheck, IconShieldX } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { Column } from '#types/extra'
import { timeAgo } from '#utils/date'
import { startCase } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { BaseSheet } from '@/components/ui/base-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dateFormatter } from '@/lib/date'
import api from '@/lib/http'

interface AdminActionRow {
  id: number
  actorId: string | null
  actorEmail: string | null
  actorRole: string | null
  action: string
  appEnv: 'dev' | 'prod' | null
  targetType: string | null
  targetId: string | null
  targetLabel: string | null
  reason: string | null
  outcome: 'success' | 'failed'
  error: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface ActionsResponse {
  data: AdminActionRow[]
  meta: { currentPage: number; perPage: number; total: number; lastPage: number }
  scope: 'all' | 'self'
}

interface AuditsIndexProps extends SharedProps {
  /** True for god and super admins: they see every operator's actions, not just theirs. */
  canReadAll: boolean
  actions: string[]
}

const ALL = '__all__'

function buildColumns(onView: (row: AdminActionRow) => void): Column<AdminActionRow>[] {
  return [
    {
      key: 'createdAt',
      header: 'When',
      width: 130,
      cell: (row) => <span title={dateFormatter(row.createdAt)}>{timeAgo(row.createdAt)}</span>,
    },
    {
      key: 'actorEmail',
      header: 'Who',
      minWidth: 180,
      flex: 1,
      cell: (row) => (
        <div className='min-w-0'>
          <p className='truncate text-sm'>{row.actorEmail ?? '—'}</p>
          {row.actorRole && (
            <p className='truncate text-xs text-muted-foreground'>{startCase(row.actorRole)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: 190,
      cell: (row) => <span className='font-mono text-xs'>{row.action}</span>,
    },
    {
      key: 'appEnv',
      header: 'Env',
      width: 90,
      cell: (row) =>
        row.appEnv ? (
          <Badge variant={row.appEnv === 'prod' ? 'destructive' : 'secondary'}>{row.appEnv}</Badge>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    {
      key: 'targetLabel',
      header: 'Target',
      minWidth: 160,
      flex: 1,
      cell: (row) => (
        <span className='truncate text-sm' title={row.targetLabel ?? undefined}>
          {row.targetLabel ?? row.targetId ?? '—'}
        </span>
      ),
    },
    {
      key: 'outcome',
      header: 'Result',
      width: 100,
      cell: (row) =>
        row.outcome === 'success' ? (
          <span className='inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm'>
            <IconShieldCheck className='h-4 w-4' /> ok
          </span>
        ) : (
          <span className='inline-flex items-center gap-1 text-destructive text-sm'>
            <IconShieldX className='h-4 w-4' /> failed
          </span>
        ),
    },
    {
      key: 'view',
      header: '',
      width: 80,
      cell: (row) => (
        <Button type='button' variant='ghost' size='sm' onClick={() => onView(row)}>
          Details
        </Button>
      ),
    },
  ]
}

/**
 * The operator action log.
 *
 * Records intent — who did what, in which database, and why — which the model-level
 * `audits` table cannot express. Before this page existed the audit endpoint was scoped
 * to the calling user with no way to widen it, so nobody could answer "who banned this
 * customer?"
 */
export default function AuditsIndex({ canReadAll, actions }: AuditsIndexProps) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [action, setAction] = useState(ALL)
  const [appEnv, setAppEnv] = useState(ALL)
  const [outcome, setOutcome] = useState(ALL)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminActionRow | null>(null)

  const query = useQuery({
    queryKey: ['admin-actions', page, perPage, action, appEnv, outcome, search],
    queryFn: async () => {
      const response = await api.audits.actions({
        query: {
          page: String(page),
          perPage: String(perPage),
          ...(action !== ALL && { action }),
          ...(appEnv !== ALL && { appEnv }),
          ...(outcome !== ALL && { outcome }),
          ...(search.trim() && { search: search.trim() }),
        },
      })
      /**
       * The rows arrive serialized, but the controller returns Lucid models, so the
       * inferred row type is the model class (`DateTime` fields and all) rather than
       * the JSON the client receives. `AdminActionRow` describes the wire shape.
       */
      return response as unknown as ActionsResponse
    },
  })

  const rows = query.data?.data ?? []

  return (
    <DashboardPage
      title='Audit trail'
      description={
        canReadAll
          ? 'Every operator action across both databases.'
          : 'Your own actions. Ask a super admin for the full trail.'
      }>
      <Head title='Audit trail' />

      <AppCard title='Operator actions' description={`${query.data?.meta?.total ?? 0} recorded`}>
        <div className='space-y-4'>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='audit-search'>Search</Label>
              <Input
                id='audit-search'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder='Email, target or reason'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='audit-action'>Action</Label>
              <Select
                id='audit-action'
                value={action}
                onValueChange={(value) => {
                  setAction(value ?? ALL)
                  setPage(1)
                }}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='All actions' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All actions</SelectItem>
                  {actions.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='audit-env'>Environment</Label>
              <Select
                id='audit-env'
                value={appEnv}
                onValueChange={(value) => {
                  setAppEnv(value ?? ALL)
                  setPage(1)
                }}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='All environments' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All environments</SelectItem>
                  <SelectItem value='prod'>Production</SelectItem>
                  <SelectItem value='dev'>Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='audit-outcome'>Result</Label>
              <Select
                id='audit-outcome'
                value={outcome}
                onValueChange={(value) => {
                  setOutcome(value ?? ALL)
                  setPage(1)
                }}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Any result' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any result</SelectItem>
                  <SelectItem value='success'>Succeeded</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={buildColumns(setSelected)}
            data={rows}
            loading={query.isLoading}
            emptyMessage='No actions recorded yet.'
            pagination={{
              page: query.data?.meta?.currentPage ?? page,
              pageSize: query.data?.meta?.perPage ?? perPage,
              total: query.data?.meta?.total ?? 0,
              onPageChange: setPage,
              onPageSizeChange: (size) => {
                setPerPage(size)
                setPage(1)
              },
            }}
          />
        </div>
      </AppCard>

      <BaseSheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title={selected?.action ?? 'Action'}
        description={selected ? dateFormatter(selected.createdAt) : undefined}>
        {selected && (
          <dl className='space-y-3 text-sm'>
            <Detail label='Actor' value={selected.actorEmail} />
            <Detail label='Role' value={selected.actorRole && startCase(selected.actorRole)} />
            <Detail label='Environment' value={selected.appEnv} />
            <Detail
              label='Target'
              value={
                selected.targetLabel ||
                [selected.targetType, selected.targetId].filter(Boolean).join(' ')
              }
            />
            <Detail label='Reason' value={selected.reason} />
            <Detail label='Result' value={selected.outcome} />
            <Detail label='Error' value={selected.error} />
            <Detail label='IP address' value={selected.ipAddress} />
            {selected.metadata && (
              <div>
                <dt className='text-xs uppercase tracking-wide text-muted-foreground'>Metadata</dt>
                <dd>
                  <pre className='mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs'>
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </dd>
              </div>
            )}
          </dl>
        )}
      </BaseSheet>
    </DashboardPage>
  )
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className='text-xs uppercase tracking-wide text-muted-foreground'>{label}</dt>
      <dd className='break-words'>{value}</dd>
    </div>
  )
}
