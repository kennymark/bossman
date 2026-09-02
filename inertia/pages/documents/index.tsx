import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred } from '@inertiajs/react'
import {
  IconAlertTriangle,
  IconCalendarClock,
  IconCalendarEvent,
  IconDownload,
  IconFiles,
  IconShieldCheck,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { PaginatedResponse } from '#types/extra'
import type { RawDocument } from '#types/model-types'
import { DOCUMENT_TYPES } from '#utils/document_expiry'
import { formatNumber, startCase } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { StatCard } from '@/components/dashboard/stat-card'
import { buildDocumentColumns } from '@/components/documents'
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

interface DocumentsIndexProps extends SharedProps {
  documents: PaginatedResponse<RawDocument>
}

interface DocumentStats {
  total: number
  compliance: number
  expired: number
  expiring30: number
  expiring90: number
  byDocType: { docType: string; count: number }[]
}

const ALL = 'all'

const EXPIRY_OPTIONS = [
  { value: ALL, label: 'Any expiry' },
  { value: 'expired', label: 'Expired' },
  { value: 'expiring_30', label: 'Expiring in 30 days' },
  { value: 'expiring_90', label: 'Expiring in 90 days' },
  { value: 'no_expiry', label: 'No expiry date' },
]

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'expires_at:asc', label: 'Expiring soonest' },
  { value: 'expires_at:desc', label: 'Expiring latest' },
  { value: 'name:asc', label: 'Name A–Z' },
  { value: 'name:desc', label: 'Name Z–A' },
]

/** Query keys the export endpoint accepts; page and size are deliberately left out. */
const EXPORT_KEYS = ['compliance', 'expiry', 'docType', 'search', 'sortBy', 'sortOrder'] as const

function exportHref(query: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const key of EXPORT_KEYS) {
    const value = query[key]
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return `/api/v1/documents/export${qs ? `?${qs}` : ''}`
}

const columns = buildDocumentColumns({ showOrg: true })

export default function DocumentsIndex({ documents }: DocumentsIndexProps) {
  const { changePage, changeRows, updateQuery, query } = useInertiaParams({
    page: 1,
    perPage: 20,
    search: '',
  })

  const compliance = query.compliance === 'compliance_only' ? 'compliance_only' : ALL
  const expiry = typeof query.expiry === 'string' ? query.expiry : ALL
  const docType = typeof query.docType === 'string' ? query.docType : ALL
  const sortValue = `${query.sortBy || 'created_at'}:${query.sortOrder || 'desc'}`

  const { data: stats } = useQuery({
    queryKey: ['documents-stats'],
    queryFn: async () => (await api.documents.stats({})) as unknown as DocumentStats,
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
      title='Documents'
      description='Documents and compliance certificates across every customer organisation.'
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
          description='All live documents'
          value={formatNumber(stats?.total)}
          icon={IconFiles}
        />
        <StatCard
          title='Compliance'
          description='Flagged as compliance'
          value={formatNumber(stats?.compliance)}
          icon={IconShieldCheck}
          iconClassName='h-4 w-4 text-indigo-600'
        />
        <StatCard
          title='Expired'
          description='Expiry date has passed'
          value={formatNumber(stats?.expired)}
          icon={IconAlertTriangle}
          iconClassName='h-4 w-4 text-red-600'
        />
        <StatCard
          title='Expiring in 30 days'
          description='Renewal needed soon'
          value={formatNumber(stats?.expiring30)}
          icon={IconCalendarClock}
          iconClassName='h-4 w-4 text-orange-600'
        />
        <StatCard
          title='Expiring in 90 days'
          description='Includes the 30-day set'
          value={formatNumber(stats?.expiring90)}
          icon={IconCalendarEvent}
          iconClassName='h-4 w-4 text-blue-600'
        />
      </SimpleGrid>

      {stats?.byDocType && stats.byDocType.length > 0 && (
        <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
          <span>By type:</span>
          {stats.byDocType.map((entry) => (
            <Badge key={entry.docType} variant='outline'>
              {startCase(entry.docType)}: {formatNumber(entry.count)}
            </Badge>
          ))}
        </div>
      )}

      <AppCard title='All documents' description='Filter by compliance, expiry or type.'>
        <div className='mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='documents-compliance'>Compliance</Label>
            <Select
              id='documents-compliance'
              value={compliance}
              onValueChange={(v) => setFilter('compliance', v)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='All documents' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All documents</SelectItem>
                <SelectItem value='compliance_only'>Compliance only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='documents-expiry'>Expiry</Label>
            <Select
              id='documents-expiry'
              value={expiry}
              onValueChange={(v) => setFilter('expiry', v)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Any expiry' />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='documents-type'>Type</Label>
            <Select
              id='documents-type'
              value={docType}
              onValueChange={(v) => setFilter('docType', v)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='All types' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                {DOCUMENT_TYPES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {startCase(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='documents-sort'>Sort</Label>
            <Select id='documents-sort' value={sortValue} onValueChange={setSort}>
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

        <Deferred data='documents' fallback={<LoadingSkeleton type='table' />}>
          <DataTable
            columns={columns}
            data={documents?.data ?? []}
            searchable
            searchPlaceholder='Search name or file name...'
            searchValue={String(query.search || '')}
            searchDebounceMs={300}
            onSearchChange={(value) => updateQuery({ search: value || undefined, page: 1 })}
            pagination={tablePagination(documents, {
              onPageChange: changePage,
              onPageSizeChange: changeRows,
            })}
            emptyMessage='No documents match these filters'
          />
        </Deferred>
      </AppCard>
    </DashboardPage>
  )
}
