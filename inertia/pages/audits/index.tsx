import type { SharedProps } from '@adonisjs/inertia/types'
import { Head } from '@inertiajs/react'
import { IconShieldCheck, IconShieldX, IconX } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import type { Column } from '#types/extra'
import { timeAgo } from '#utils/date'
import { startCase } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { ExportButton } from '@/components/dashboard/export-button'
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

/**
 * Filters the page accepts from its URL, so another page can deep-link to one slice
 * of the trail — `/audits?targetType=Org&targetId=<id>` is a customer's history.
 */
const URL_FILTER_KEYS = [
  'targetType',
  'targetId',
  'action',
  'actorId',
  'appEnv',
  'outcome',
  'startDate',
  'endDate',
  'search',
] as const

type UrlFilterKey = (typeof URL_FILTER_KEYS)[number]
type UrlFilters = Record<UrlFilterKey, string>

function readUrlFilters(): UrlFilters {
  const filters = Object.fromEntries(URL_FILTER_KEYS.map((key) => [key, ''])) as UrlFilters
  if (typeof window === 'undefined') return filters

  const params = new URLSearchParams(window.location.search)
  for (const key of URL_FILTER_KEYS) {
    filters[key] = params.get(key)?.trim() ?? ''
  }
  return filters
}

/**
 * Call sites record customers as `Org`, but a hand-written link may well say `org`
 * (the server matches either). The chip should read "org" for all of them.
 */
function isOrgTarget(targetType: string): boolean {
  return /^org(anisation|anization)?s?$/i.test(targetType)
}

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
 *
 * Filters initialise from the URL and are written back to it, so a filtered view can
 * be linked to, refreshed, and exported as-is.
 */
export default function AuditsIndex({ canReadAll, actions }: AuditsIndexProps) {
  const [initial] = useState(readUrlFilters)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [action, setAction] = useState(initial.action || ALL)
  const [appEnv, setAppEnv] = useState(initial.appEnv || ALL)
  const [outcome, setOutcome] = useState(initial.outcome || ALL)
  const [search, setSearch] = useState(initial.search)
  const [actorId, setActorId] = useState(initial.actorId)
  const [target, setTarget] = useState({ type: initial.targetType, id: initial.targetId })
  const [dateRange, setDateRange] = useState({ start: initial.startDate, end: initial.endDate })
  const [selected, setSelected] = useState<AdminActionRow | null>(null)

  /** Everything but the page: what the query, the URL and the export all share. */
  const filters = useMemo(
    () => ({
      ...(action !== ALL && { action }),
      ...(appEnv !== ALL && { appEnv }),
      ...(outcome !== ALL && { outcome }),
      ...(search.trim() && { search: search.trim() }),
      ...(actorId && { actorId }),
      ...(target.type && { targetType: target.type }),
      ...(target.id && { targetId: target.id }),
      ...(dateRange.start &&
        dateRange.end && { startDate: dateRange.start, endDate: dateRange.end }),
    }),
    [action, appEnv, outcome, search, actorId, target, dateRange],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(filters)
    const next = `${window.location.pathname}${params.size ? `?${params}` : ''}`
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, '', next)
    }
  }, [filters])

  const query = useQuery({
    queryKey: ['admin-actions', page, perPage, filters],
    queryFn: async () => {
      const response = await api.audits.actions({
        query: { page: String(page), perPage: String(perPage), ...filters },
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

  const chips: { key: string; label: string; onRemove: () => void }[] = []
  if (target.type || target.id) {
    const noun = target.type && !isOrgTarget(target.type) ? target.type : 'org'
    chips.push({
      key: 'target',
      label: `Filtered to ${noun} ${target.id || '(any)'}`,
      onRemove: () => {
        setTarget({ type: '', id: '' })
        setPage(1)
      },
    })
  }
  if (actorId) {
    chips.push({
      key: 'actor',
      label: `Actor ${actorId}`,
      onRemove: () => {
        setActorId('')
        setPage(1)
      },
    })
  }
  if (dateRange.start && dateRange.end) {
    chips.push({
      key: 'dates',
      label: `${dateRange.start} to ${dateRange.end}`,
      onRemove: () => {
        setDateRange({ start: '', end: '' })
        setPage(1)
      },
    })
  }

  return (
    <DashboardPage
      title='Audit trail'
      description={
        canReadAll
          ? 'Every operator action across both databases.'
          : 'Your own actions. Ask a super admin for the full trail.'
      }>
      <Head title='Audit trail' />

      <AppCard
        title={
          <div className='flex items-center justify-between gap-2'>
            <span>Operator actions</span>
            <ExportButton href='/api/v1/audits/export' query={filters} />
          </div>
        }
        description={`${query.data?.meta?.total ?? 0} recorded`}>
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

          {chips.length > 0 && (
            <div className='flex flex-wrap items-center gap-2'>
              {chips.map((chip) => (
                <Badge key={chip.key} variant='secondary' className='gap-1 pl-2 pr-1 py-1'>
                  {chip.label}
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    aria-label={`Clear filter: ${chip.label}`}
                    className='h-5 w-5 rounded-full hover:bg-muted'
                    onClick={chip.onRemove}>
                    <IconX className='h-3 w-3' />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

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
