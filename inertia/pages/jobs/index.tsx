import type { SharedProps } from '@adonisjs/inertia/types'
import { Link, usePage } from '@inertiajs/react'
import {
  IconAlertTriangle,
  IconCalendarTime,
  IconClockHour4,
  IconHash,
  IconListDetails,
  IconPlayerPlay,
  IconRefresh,
  IconRepeat,
  IconTrash,
} from '@tabler/icons-react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import type { Column } from '#types/extra'
import type {
  JobHistory,
  JobListResponse,
  JobMonitorStatus,
  JobRecord,
  JobStats,
} from '#types/jobs'
import { timeAgo } from '#utils/date'
import { formatNumber } from '#utils/functions'
import { DEFAULT_HISTORY_DAYS, JOB_QUEUES, jobDisplayName, type JobQueue } from '#utils/jobs'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/ui/loading'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/http'
import { tablePaginationFromMeta } from '@/lib/pagination'

import {
  DeleteJobDialog,
  type JobTarget,
  RerunJobDialog,
  useCanMutateJobs,
} from './components/job-action-dialogs'
import { JobHistoryChart } from './components/job-history-chart'
import { JobStatusBadge } from './components/job-status-badge'
import { JobStoreError, JobStoreNotConfigured } from './components/store-state'

const QUEUE_LABELS: Record<JobQueue, string> = {
  all: 'All',
  unique: 'Unique',
  failed: 'Failed',
  scheduled: 'Scheduled',
  recurring: 'Recurring',
  emails: 'Emails',
  payments: 'Payments',
}

const DEFAULT_PER_PAGE = 20

function stat(loading: boolean, value: number | undefined) {
  return loading ? '—' : formatNumber(value ?? 0)
}

/**
 * The Pulse/Agenda job store of the Togetha app, for the environment this session
 * points at. Everything is fetched from `/api/v1/jobs/*`; the server decides which
 * store that is.
 */
export default function JobsIndex() {
  const page = usePage<SharedProps>()
  const appEnv = page.props.appEnv
  const queryClient = useQueryClient()
  const { canMutate } = useCanMutateJobs()

  const [queue, setQueue] = useState<JobQueue>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE)
  const [rerunTarget, setRerunTarget] = useState<JobTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JobTarget | null>(null)

  const statusQuery = useQuery({
    queryKey: ['jobs', appEnv, 'status'],
    queryFn: async () => (await api.jobs.status({})) as unknown as JobMonitorStatus,
  })
  const configured = statusQuery.data?.configured === true

  const statsQuery = useQuery({
    queryKey: ['jobs', appEnv, 'stats'],
    queryFn: async () => (await api.jobs.stats({})) as unknown as JobStats,
    enabled: configured,
  })

  const historyQuery = useQuery({
    queryKey: ['jobs', appEnv, 'history', DEFAULT_HISTORY_DAYS],
    queryFn: async () =>
      (await api.jobs.history({
        query: { days: DEFAULT_HISTORY_DAYS } as never,
      })) as unknown as JobHistory,
    enabled: configured,
  })

  const listQuery = useQuery({
    queryKey: ['jobs', appEnv, 'list', { queue, search, page: currentPage, perPage }],
    queryFn: async () =>
      (await api.jobs.list({
        query: {
          queue,
          search: search || undefined,
          page: currentPage,
          perPage,
        } as never,
      })) as unknown as JobListResponse,
    enabled: configured,
    placeholderData: keepPreviousData,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['jobs', appEnv] })

  const columns = useMemo<Column<JobRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'Job',
        minWidth: 200,
        flex: 2,
        cell: (row) => (
          <div className='flex flex-wrap items-center gap-2'>
            <Link href={`/jobs/${row.id}`} className='font-medium hover:underline'>
              {jobDisplayName(row.name)}
            </Link>
            {row.isRerun && <Badge variant='indigo'>Re-run</Badge>}
            {row.disabled && <Badge variant='outline'>Disabled</Badge>}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 120,
        cell: (row) => <JobStatusBadge status={row.status} />,
      },
      {
        key: 'lastRunAt',
        header: 'Last run',
        width: 150,
        cell: (row) => <span className='text-muted-foreground'>{timeAgo(row.lastRunAt)}</span>,
      },
      {
        key: 'nextRunAt',
        header: 'Next run',
        width: 150,
        cell: (row) => <span className='text-muted-foreground'>{timeAgo(row.nextRunAt)}</span>,
      },
      {
        key: 'failCount',
        header: 'Failures',
        width: 90,
        cell: (row) =>
          row.failCount > 0 ? (
            <span className='font-medium text-destructive'>{row.failCount}</span>
          ) : (
            <span className='text-muted-foreground'>0</span>
          ),
      },
      {
        key: 'repeatInterval',
        header: 'Repeats',
        width: 140,
        cell: (row) =>
          row.repeatInterval ? (
            <code className='text-xs'>{row.repeatInterval}</code>
          ) : (
            <span className='text-muted-foreground'>—</span>
          ),
      },
      {
        key: 'id',
        header: 'ID',
        width: 220,
        cell: (row) => <code className='text-xs text-muted-foreground'>{row.id}</code>,
      },
      {
        key: 'actions',
        header: '',
        width: 110,
        cell: (row) => (
          <div className='flex justify-end gap-1'>
            <Button
              size='xs'
              variant='ghost'
              title='Re-run'
              aria-label={`Re-run ${row.name}`}
              disabled={!canMutate}
              onClick={() => setRerunTarget({ id: row.id, name: row.name })}>
              <IconPlayerPlay />
            </Button>
            <Button
              size='xs'
              variant='ghost'
              title='Delete'
              aria-label={`Delete ${row.name}`}
              disabled={!canMutate}
              className='text-destructive hover:text-destructive'
              onClick={() => setDeleteTarget({ id: row.id, name: row.name })}>
              <IconTrash />
            </Button>
          </div>
        ),
      },
    ],
    [canMutate],
  )

  const stats = statsQuery.data
  const statsLoading = statsQuery.isLoading
  const pagination = tablePaginationFromMeta(listQuery.data?.meta, {
    onPageChange: setCurrentPage,
    onPageSizeChange: (size) => {
      setPerPage(size)
      setCurrentPage(1)
    },
  })

  return (
    <DashboardPage
      title='Jobs'
      description={`Background jobs in the ${appEnv === 'prod' ? 'production' : 'development'} job store.`}
      actions={
        <Button
          variant='outline'
          size='md'
          leftIcon={<IconRefresh />}
          onClick={refresh}
          disabled={!configured}>
          Refresh
        </Button>
      }>
      {statusQuery.isLoading && <LoadingSkeleton type='card' count={2} />}
      {statusQuery.isError && <JobStoreError error={statusQuery.error} />}
      {statusQuery.data && !configured && <JobStoreNotConfigured appEnv={appEnv} />}

      {configured && (
        <>
          {statsQuery.isError ? (
            <JobStoreError error={statsQuery.error} title='Stats unavailable' />
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                <StatCard
                  title='All jobs'
                  description='Documents in the store'
                  value={stat(statsLoading, stats?.all)}
                  icon={IconListDetails}
                />
                <StatCard
                  title='Unique'
                  description='Distinct job names'
                  value={stat(statsLoading, stats?.unique)}
                  icon={IconHash}
                />
                <StatCard
                  title='Recurring'
                  description='With a repeat interval'
                  value={stat(statsLoading, stats?.recurring)}
                  icon={IconRepeat}
                />
                <StatCard
                  title='Scheduled'
                  description='Due to run in the future'
                  value={stat(statsLoading, stats?.scheduled)}
                  icon={IconCalendarTime}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} className='lg:grid-cols-5'>
                <StatCard
                  title='Failed'
                  description='Ever recorded a failure'
                  value={stat(statsLoading, stats?.failed)}
                  icon={IconAlertTriangle}
                  iconClassName='bg-destructive/10 text-destructive'
                />
                <StatCard
                  title='Failed this week'
                  description='Finished with failures, last 7 days'
                  value={stat(statsLoading, stats?.failedLastWeek)}
                  icon={IconAlertTriangle}
                  iconClassName='bg-destructive/10 text-destructive'
                />
                <StatCard
                  title='Last hour'
                  description='Jobs finished'
                  value={stat(statsLoading, stats?.ranLastHour)}
                  icon={IconClockHour4}
                />
                <StatCard
                  title='Last 24 hours'
                  description='Jobs finished'
                  value={stat(statsLoading, stats?.ranLastDay)}
                  icon={IconClockHour4}
                />
                <StatCard
                  title='Last 7 days'
                  description='Jobs finished'
                  value={stat(statsLoading, stats?.ranLastWeek)}
                  icon={IconClockHour4}
                />
              </SimpleGrid>
            </>
          )}

          {historyQuery.isError ? (
            <JobStoreError error={historyQuery.error} title='History unavailable' />
          ) : (
            <JobHistoryChart history={historyQuery.data} isLoading={historyQuery.isLoading} />
          )}

          {listQuery.isError ? (
            <JobStoreError error={listQuery.error} title='Jobs unavailable' />
          ) : (
            <DataTable
              columns={columns}
              data={listQuery.data?.data ?? []}
              loading={listQuery.isLoading}
              searchable
              searchPlaceholder='Search by job name or id…'
              searchValue={search}
              searchDebounceMs={300}
              onSearchChange={(value) => {
                setSearch(value)
                setCurrentPage(1)
              }}
              toolbarStart={
                <Tabs
                  value={queue}
                  onValueChange={(value) => {
                    setQueue(value as JobQueue)
                    setCurrentPage(1)
                  }}>
                  <TabsList className='flex-wrap h-auto'>
                    {JOB_QUEUES.map((key) => (
                      <TabsTrigger key={key} value={key}>
                        {QUEUE_LABELS[key]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              }
              pagination={pagination}
              emptyMessage='No jobs match'
              emptyDescription='Try another queue or clear the search.'
            />
          )}
        </>
      )}

      <RerunJobDialog
        job={rerunTarget}
        onOpenChange={() => setRerunTarget(null)}
        onDone={refresh}
      />
      <DeleteJobDialog
        job={deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onDone={refresh}
      />
    </DashboardPage>
  )
}
