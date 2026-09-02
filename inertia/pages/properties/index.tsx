import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, Link } from '@inertiajs/react'
import { usePage } from '@inertiajs/react'
import { IconBuilding, IconHome, IconMapPin } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'

import type { Column, PaginatedResponse } from '#types/extra'
import type { RawLeaseableEntity, RawUser } from '#types/model-types'
import { formatNumber } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataAccessExpiredAlert } from '@/components/dashboard/data-access-expired-alert'
import { DataTable } from '@/components/dashboard/data-table'
import { ExportButton } from '@/components/dashboard/export-button'
import { StatCard } from '@/components/dashboard/stat-card'
import { LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { dateFormatter } from '@/lib/date'
import api from '@/lib/http'
import { tablePagination } from '@/lib/pagination'

const columns: Column<RawLeaseableEntity>[] = [
  {
    key: 'address',
    header: 'Address',
    cell: (row) => (
      <Link href={`/properties/${row.id}`} className='font-medium hover:underline'>
        {row.address || '—'}
      </Link>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    cell: (row) => (
      <Badge variant='outline' className='capitalize'>
        {row.type}
      </Badge>
    ),
  },

  {
    key: 'isVacant',
    header: 'Status',
    cell: (row) =>
      row.isVacant ? (
        <Badge variant='secondary'>Vacant</Badge>
      ) : (
        <Badge variant='default'>Occupied</Badge>
      ),
  },
  {
    key: 'createdAt',
    header: 'Published',
    cell: (row) => (row.createdAt ? dateFormatter(row.createdAt) : '—'),
  },
]

type LeaseableEntitiesStats = { total: number; vacant: number; occupied: number }

interface LeaseableEntitiesIndexProps extends SharedProps {
  leaseableEntities: PaginatedResponse<RawLeaseableEntity>
  dataAccessExpired?: boolean
  dataAccessExpiredAt?: string | null
}

export default function LeaseableEntitiesIndex({
  leaseableEntities,
  dataAccessExpired,
  dataAccessExpiredAt,
}: LeaseableEntitiesIndexProps) {
  const page = usePage()
  const user = page.props.user as RawUser | undefined
  const isGodAdmin = Boolean(user?.isGodAdmin)
  const { changePage, changeRows, searchTable, query } = useInertiaParams({
    page: 1,
    perPage: 20,
    search: '',
  })

  const { data: stats } = useQuery({
    queryKey: ['leaseable-entities-stats'],
    queryFn: async () => {
      return await api.leaseableEntities.stats({})
    },
    enabled: isGodAdmin,
  })

  return (
    <DashboardPage
      title='Properties'
      description='Standalone properties and blocks of properties available for lease.'>
      <DataAccessExpiredAlert
        expired={Boolean(dataAccessExpired)}
        expiredAt={dataAccessExpiredAt}
      />

      {isGodAdmin && (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={4}>
          <StatCard
            title='Total'
            description='All properties'
            value={formatNumber(stats?.total)}
            icon={IconBuilding}
          />
          <StatCard
            title='Vacant'
            description='Available to let'
            value={formatNumber(stats?.vacant)}
            icon={IconHome}
            iconClassName='h-4 w-4 text-amber-600'
          />
          <StatCard
            title='Occupied'
            description='Currently let'
            value={formatNumber(stats?.occupied)}
            icon={IconMapPin}
            iconClassName='h-4 w-4 text-green-600'
          />
        </SimpleGrid>
      )}

      <Deferred data='leaseableEntities' fallback={<LoadingSkeleton type='table' />}>
        <AppCard
          title={
            <div className='flex items-center justify-between gap-2'>
              <span>All properties</span>
              <ExportButton
                href='/api/v1/leaseable-entities/export'
                query={{
                  search: String(query.search || ''),
                  sortBy: query.sortBy ? String(query.sortBy) : '',
                  sortOrder: query.sortOrder ? String(query.sortOrder) : '',
                  startDate: query.startDate ? String(query.startDate) : '',
                  endDate: query.endDate ? String(query.endDate) : '',
                }}
              />
            </div>
          }
          description={`${leaseableEntities?.meta?.total ?? 0} total`}>
          <DataTable
            columns={columns}
            data={leaseableEntities?.data ?? []}
            searchable
            searchPlaceholder='Search by address...'
            searchValue={String(query.search || '')}
            onSearchChange={(value) => searchTable(String(value || ''))}
            pagination={tablePagination(leaseableEntities, {
              onPageChange: changePage,
              onPageSizeChange: changeRows,
            })}
            emptyMessage='No properties found'
          />
        </AppCard>
      </Deferred>
    </DashboardPage>
  )
}
