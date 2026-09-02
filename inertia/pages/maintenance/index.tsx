import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred } from '@inertiajs/react'
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClockExclamation,
  IconDownload,
  IconTool,
  IconTools,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { PaginatedResponse } from '#types/extra'
import type { RawMaintenanceRequest } from '#types/model-types'
import { formatNumber } from '#utils/functions'
import {
  MAINTENANCE_SEVERITIES,
  MAINTENANCE_SEVERITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUSES,
  parseOverdueFlag,
} from '#utils/maintenance_status'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { StatCard } from '@/components/dashboard/stat-card'
import { buildMaintenanceColumns } from '@/components/maintenance'
import { Badge, LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import api from '@/lib/http'
import { tablePagination } from '@/lib/pagination'

interface MaintenanceIndexProps extends SharedProps {
  maintenanceRequests: PaginatedResponse<RawMaintenanceRequest>
}

interface MaintenanceStats {
  total: number
  open: number
  overdue: number
  completedLast30Days: number
  highSeverityOpen: number
  byStatus: Record<string, number>
}

const ALL = 'all'
const OVERDUE_ONLY = 'overdue'

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'due_date:asc', label: 'Due soonest' },
  { value: 'due_date:desc', label: 'Due latest' },
  { value: 'severity:asc', label: 'Severity' },
  { value: 'status:asc', label: 'Status' },
]

/** Query keys the export endpoint accepts; page and size are deliberately left out. */
const EXPORT_KEYS = ['status', 'severity', 'overdue', 'search', 'sortBy', 'sortOrder'] as const

function exportHref(query: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const key of EXPORT_KEYS) {
    const value = query[key]
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return `/api/v1/maintenance/export${qs ? `?${qs}` : ''}`
}

const columns = buildMaintenanceColumns({ showOrg: true })

export default function MaintenanceIndex({ maintenanceRequests }: MaintenanceIndexProps) {
  const { changePage, changeRows, updateQuery, query } = useInertiaParams({
    page: 1,
    perPage: 20,
    search: '',
  })

  const status = typeof query.status === 'string' ? query.status : ALL
  const severity = typeof query.severity === 'string' ? query.severity : ALL
  const overdue = parseOverdueFlag(query.overdue as string | number | boolean | undefined)
  const sortValue = `${query.sortBy || 'created_at'}:${query.sortOrder || 'desc'}`

  const { data: stats } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: async () => (await api.maintenance.stats({})) as unknown as MaintenanceStats,
  })

  const href = useMemo(() => exportHref(query), [query])

  /** `undefined` drops the key from the URL; an empty string would fail the enum. */
  const setFilter = (key: string, value: string | null) =>
    updateQuery({ [key]: !value || value === ALL ? undefined : value, page: 1 })

  const setSort = (value: string | null) => {
    const [sortBy, sortOrder] = (value ?? 'created_at:desc').split(':')
    updateQuery({ sortBy, sortOrder, page: 1 })
  }

  return (
    <DashboardPage
      title='Maintenance'
      description='Maintenance requests across every customer organisation.'
      actions={
        <Button variant='outline' size='sm' asChild>
          <a href={href}>
            <IconDownload className='h-4 w-4' />
            Export CSV
          </a>
        </Button>
      }>
      <SimpleGrid cols={{ base: 1, md: 2, lg: 5 }} spacing={4}>
        <StatCard
          title='Total'
          description='All live requests'
          value={formatNumber(stats?.total)}
          icon={IconTools}
        />
        <StatCard
          title='Open'
          description='To do or in progress'
          value={formatNumber(stats?.open)}
          icon={IconTool}
          iconClassName='h-4 w-4 text-blue-600'
        />
        <StatCard
          title='Overdue'
          description='Past due and not complete'
          value={formatNumber(stats?.overdue)}
          icon={IconClockExclamation}
          iconClassName='h-4 w-4 text-red-600'
        />
        <StatCard
          title='High severity'
          description='High severity, still open'
          value={formatNumber(stats?.highSeverityOpen)}
          icon={IconAlertTriangle}
          iconClassName='h-4 w-4 text-orange-600'
        />
        <StatCard
          title='Completed'
          description='Last 30 days'
          value={formatNumber(stats?.completedLast30Days)}
          icon={IconCircleCheck}
          iconClassName='h-4 w-4 text-green-600'
        />
      </SimpleGrid>

      {stats?.byStatus && (
        <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
          <span>By status:</span>
          {MAINTENANCE_STATUSES.map((key) => (
            <Badge key={key} variant='outline'>
              {MAINTENANCE_STATUS_LABELS[key]}: {formatNumber(stats.byStatus[key] ?? 0)}
            </Badge>
          ))}
        </div>
      )}

      <AppCard title='All requests' description='Filter by status, severity or due date.'>
        <div className='mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='maintenance-status'>Status</Label>
            <Select
              id='maintenance-status'
              value={status}
              onValueChange={(v) => setFilter('status', v)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {MAINTENANCE_STATUSES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {MAINTENANCE_STATUS_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='maintenance-severity'>Severity</Label>
            <Select
              id='maintenance-severity'
              value={severity}
              onValueChange={(v) => setFilter('severity', v)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='All severities' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All severities</SelectItem>
                {MAINTENANCE_SEVERITIES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {MAINTENANCE_SEVERITY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='maintenance-overdue'>Due date</Label>
            <Select
              id='maintenance-overdue'
              value={overdue ? OVERDUE_ONLY : ALL}
              onValueChange={(v) =>
                updateQuery({ overdue: v === OVERDUE_ONLY ? '1' : undefined, page: 1 })
              }>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Any due date' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any due date</SelectItem>
                <SelectItem value={OVERDUE_ONLY}>Overdue only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='maintenance-sort'>Sort</Label>
            <Select id='maintenance-sort' value={sortValue} onValueChange={setSort}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Sort' />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Deferred data='maintenanceRequests' fallback={<LoadingSkeleton type='table' />}>
          <DataTable
            columns={columns}
            data={maintenanceRequests?.data ?? []}
            searchable
            searchPlaceholder='Search title or description...'
            searchValue={String(query.search || '')}
            searchDebounceMs={300}
            onSearchChange={(value) => updateQuery({ search: value || undefined, page: 1 })}
            pagination={tablePagination(maintenanceRequests, {
              onPageChange: changePage,
              onPageSizeChange: changeRows,
            })}
            emptyMessage='No maintenance requests match these filters'
          />
        </Deferred>
      </AppCard>
    </DashboardPage>
  )
}
