import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, Link } from '@inertiajs/react'
import { usePage } from '@inertiajs/react'
import { IconAlertCircle, IconCircleCheck, IconCircleX, IconFileText } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'

import type { Column, PaginatedResponse } from '#types/extra'
import type { RawLease, RawUser } from '#types/model-types'
import { formatCurrency } from '#utils/currency'
import { timeAgo } from '#utils/date'
import { formatNumber } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataAccessExpiredAlert } from '@/components/dashboard/data-access-expired-alert'
import { DataTable } from '@/components/dashboard/data-table'
import { StatCard } from '@/components/dashboard/stat-card'
import { LeaseStatusBadge } from '@/components/leases/status-badge'
import { LoadingSkeleton, Stack } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { dateFormatter } from '@/lib/date'
import api from '@/lib/http'
import { tablePagination } from '@/lib/pagination'

interface LeasesIndexProps extends SharedProps {
  leases: PaginatedResponse<RawLease>
  dataAccessExpired?: boolean
  dataAccessExpiredAt?: string | null
}

type Stats = { total: number; active: number; pending: number; expired: number }
const columns: Column<RawLease>[] = [
  {
    key: 'name',
    header: 'Lease',
    width: 250,
    cell: (row) => (
      <div className='space-y-1'>
        <Link href={`/leases/${row.id}`} className='font-medium hover:underline'>
          {row.cleanName || row.shortId}
        </Link>
        <Stack>
          <span className='text-xs text-muted-foreground'>
            {dateFormatter(row.startDate)} - {dateFormatter(row.endDate)}
          </span>
        </Stack>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: 130,
    cell: (row) => <LeaseStatusBadge status={row.status} />,
  },
  {
    key: 'rentAmount',
    width: 200,
    header: 'Rent',
    cell: (row) => formatCurrency(row.rentAmount, row.currency) || '—',
  },
  {
    key: 'Org',
    header: 'Org',
    width: 130,
    cell: (row) =>
      row.org ? (
        <Link href={`/orgs/${row.org.id}`} className='font-medium hover:underline'>
          {row.org.cleanName ?? row.org.name}
        </Link>
      ) : (
        '—'
      ),
  },
  {
    key: 'Created At',
    header: 'Created At',
    width: 130,
    cell: (row) => timeAgo(row.createdAt),
  },
]

export default function LeasesIndex({
  leases,
  dataAccessExpired = false,
  dataAccessExpiredAt = null,
}: LeasesIndexProps) {
  const page = usePage()
  const user = page.props.user as RawUser | undefined
  const isGodAdmin = Boolean(user?.isGodAdmin)
  const { changePage, changeRows, searchTable, query } = useInertiaParams({
    page: 1,
    perPage: 20,
    search: '',
  })

  const { data: stats } = useQuery({
    queryKey: ['leases-stats2'],
    queryFn: async () => await api.leases.stats({}),
    enabled: isGodAdmin,
  })

  return (
    <DashboardPage title='Leases' description='All leases for your organisation.'>
      <DataAccessExpiredAlert expired={dataAccessExpired} expiredAt={dataAccessExpiredAt} />

      {isGodAdmin && (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <StatCard
            title='Total'
            description='All leases'
            value={formatNumber(stats?.total)}
            icon={IconFileText}
          />
          <StatCard
            title='Active'
            description='Currently active'
            value={formatNumber(stats?.active)}
            icon={IconCircleCheck}
            iconClassName='h-4 w-4 text-green-600'
          />
          <StatCard
            title='Pending'
            description='Awaiting completion'
            value={formatNumber(stats?.pending)}
            icon={IconAlertCircle}
          />
          <StatCard
            title='Expired'
            description='Ended leases'
            value={formatNumber(stats?.expired)}
            icon={IconCircleX}
          />
        </SimpleGrid>
      )}

      <Deferred data='leases' fallback={<LoadingSkeleton type='table' />}>
        <AppCard title='All leases'>
          <DataTable
            columns={columns}
            data={leases?.data}
            searchable
            searchPlaceholder='Search by name...'
            searchValue={String(query.search || '')}
            onSearchChange={(value) => searchTable(String(value || ''))}
            pagination={tablePagination(leases, {
              onPageChange: changePage,
              onPageSizeChange: changeRows,
            })}
            emptyMessage='No leases found'
          />
        </AppCard>
      </Deferred>
    </DashboardPage>
  )
}
