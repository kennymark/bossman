import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, Link, router } from '@inertiajs/react'
import { usePage } from '@inertiajs/react'
import {
  IconBriefcase,
  IconBuilding,
  IconFlask,
  IconPlus,
  IconStar,
  IconUser,
} from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Column, PaginatedResponse } from '#types/extra'
import type { RawOrg, RawUser } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { formatNumber } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { ExportButton } from '@/components/dashboard/export-button'
import { FilterSortBar } from '@/components/dashboard/filter-sort-bar'
import { StatCard } from '@/components/dashboard/stat-card'
import { LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'
import { tablePagination } from '@/lib/pagination'

const ORGS_SORT_BY_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'owner_role', label: 'Type' },
  { value: 'country', label: 'Country' },
  { value: 'has_active_subscription', label: 'Subscription' },
  { value: 'created_at', label: 'Created at' },
]

const ORGS_SORT_ORDER_OPTIONS = [
  { value: 'desc' as const, label: 'Z–A' },
  { value: 'asc' as const, label: 'A–Z' },
]

type OrgsStats = { total: number; landlords: number; agencies: number }

const columns: Column<RawOrg>[] = [
  {
    key: 'cleanName',
    header: 'Name',
    cell: (row) => (
      <div className='space-y-1'>
        <Link href={`/orgs/${row.id}`} className='font-medium hover:underline'>
          {row.cleanName}
        </Link>
        {row.companyName && row.companyName !== row.cleanName && (
          <div className='text-xs text-muted-foreground'>{row.companyName}</div>
        )}
      </div>
    ),
  },
  {
    key: 'ownerRole',
    header: 'Type',
    cell: (row) => (
      <Badge variant='outline' className='capitalize'>
        {row.ownerRole}
      </Badge>
    ),
  },
  {
    key: 'country',
    header: 'Country',
    cell: (row) => row.country ?? '—',
  },
  {
    key: 'hasActiveSubscription',
    header: 'Subscription',
    cell: (row) =>
      row.hasActiveSubscription ? (
        <Badge variant='default'>Active</Badge>
      ) : (
        <Badge variant='secondary'>Inactive</Badge>
      ),
  },
  {
    key: 'isFavourite',
    header: 'Favourite',
    width: 120,
    cell: (row) =>
      row.isFavourite ? (
        <IconStar className='h-4 w-4 text-yellow-500' />
      ) : (
        <span className='text-muted-foreground text-sm'>—</span>
      ),
  },
  {
    key: 'isTestAccount',
    header: 'Test',
    width: 110,
    cell: (row) =>
      row.isTestAccount ? (
        <Badge variant='outline' className='gap-1 w-fit'>
          <IconFlask className='h-3 w-3' />
          Yes
        </Badge>
      ) : (
        <span className='text-muted-foreground text-sm'>—</span>
      ),
  },
  {
    key: 'createdAt',
    header: 'Created at',
    cell: (row) => timeAgo(row.createdAt ?? ''),
  },
]

interface OrgsIndexProps extends SharedProps {
  orgs: PaginatedResponse<RawOrg>
  stats: OrgsStats
}

export default function OrgsIndex({ orgs, stats }: OrgsIndexProps) {
  const page = usePage()
  const user = page.props.user as RawUser | undefined
  const isGodAdmin = Boolean(user?.isGodAdmin)
  const { changePage, changeRows, searchTable, query, updateQuery } = useInertiaParams({
    page: 1,
    perPage: 20,
    search: '',
    includeTestAccounts: false,
    favouritesOnly: false,
    ownerRole: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const includeTestAccounts = query.includeTestAccounts === true
  const favouritesOnly = query.favouritesOnly
  const ownerRole = query.ownerRole
  const sortBy = String(query.sortBy ?? 'created_at')
  const sortOrder = query.sortOrder ?? 'desc'
  const hasActiveFilters =
    includeTestAccounts ||
    favouritesOnly ||
    !!ownerRole ||
    sortBy !== 'created_at' ||
    sortOrder !== 'desc'

  const handleFilterChange = (updates: Record<string, string | boolean>) => {
    updateQuery({ ...updates, page: 1 })
  }

  const clearAllFilters = () => {
    updateQuery({
      includeTestAccounts: false,
      favouritesOnly: false,
      ownerRole: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
    })
  }

  const filterSortFields = useMemo(
    () => [
      {
        type: 'switch' as const,
        key: 'includeTestAccounts',
        label: 'Include test accounts',
        value: includeTestAccounts,
      },
      {
        type: 'switch' as const,
        key: 'favouritesOnly',
        label: 'Favourites only',
        value: favouritesOnly,
      },
      {
        type: 'select' as const,
        key: 'ownerRole',
        label: 'Type',
        value: ownerRole,
        options: [
          { value: 'landlord', label: 'Landlord' },
          { value: 'agency', label: 'Agency' },
        ],
        placeholder: 'All types',
        triggerClassName: 'w-[140px] h-9',
      },
    ],
    [includeTestAccounts, favouritesOnly, ownerRole],
  )

  const sortConfig = useMemo(
    () => ({
      sortBy,
      sortByOptions: ORGS_SORT_BY_OPTIONS,
      sortOrder,
      sortOrderOptions: ORGS_SORT_ORDER_OPTIONS,
      sortByTriggerClassName: 'w-[160px] h-9',
      sortOrderTriggerClassName: 'w-[100px] h-9',
    }),
    [sortBy, sortOrder],
  )

  const activeChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = []
    if (includeTestAccounts) {
      chips.push({
        label: 'Test accounts',
        onRemove: () => handleFilterChange({ includeTestAccounts: false }),
      })
    }
    if (favouritesOnly) {
      chips.push({
        label: 'Favourites only',
        onRemove: () => handleFilterChange({ favouritesOnly: false }),
      })
    }
    if (ownerRole) {
      chips.push({
        label: ownerRole.charAt(0).toUpperCase() + ownerRole.slice(1),
        onRemove: () => handleFilterChange({ ownerRole: '' }),
      })
    }
    return chips
  }, [includeTestAccounts, favouritesOnly, ownerRole, handleFilterChange])

  const bulkMakeFavouriteMutation = useMutation({
    mutationFn: (orgIds: string[]) => api.orgActions.bulkMakeFavourite({ body: { orgIds } }),
    onSuccess: (_, orgIds) => {
      toast.success(`${orgIds.length} org(s) marked as favourite`)
      setSelectedRows([])
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update')
    },
  })

  const bulkUndoFavouriteMutation = useMutation({
    mutationFn: (orgIds: string[]) => api.orgActions.bulkUndoFavourite({ body: { orgIds } }),
    onSuccess: (_, orgIds) => {
      toast.success(`${orgIds.length} org(s) removed from favourites`)
      setSelectedRows([])
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update')
    },
  })

  const bulkMakeTestAccountMutation = useMutation({
    mutationFn: (orgIds: string[]) => api.orgActions.bulkMakeTestAccount({ body: { orgIds } }),
    onSuccess: (_, orgIds) => {
      toast.success(`${orgIds.length} org(s) marked as test account`)
      setSelectedRows([])
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update')
    },
  })

  const bulkUndoTestAccountMutation = useMutation({
    mutationFn: (orgIds: string[]) => api.orgActions.bulkUndoTestAccount({ body: { orgIds } }),
    onSuccess: (_, orgIds) => {
      toast.success(`${orgIds.length} org(s) removed test account flag`)
      setSelectedRows([])
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update')
    },
  })

  const bulkActions = [
    {
      label: 'Make favourite',
      variant: 'outline' as const,
      action: (ids: string[]) => bulkMakeFavouriteMutation.mutate(ids),
    },
    {
      label: 'Undo favourite',
      variant: 'outline' as const,
      action: (ids: string[]) => bulkUndoFavouriteMutation.mutate(ids),
    },
    {
      label: 'Make test account',
      variant: 'outline' as const,
      action: (ids: string[]) => bulkMakeTestAccountMutation.mutate(ids),
    },
    {
      label: 'Undo test account',
      variant: 'outline' as const,
      action: (ids: string[]) => bulkUndoTestAccountMutation.mutate(ids),
    },
  ]

  return (
    <DashboardPage
      title='Customers'
      description='View and manage customers.'
      actions={
        <Button asChild>
          <Link href='/orgs/create'>
            <IconPlus className='mr-2 h-4 w-4' />
            Create
          </Link>
        </Button>
      }>
      {isGodAdmin && (
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={4}>
          <StatCard
            title='Total'
            description='All customers'
            value={formatNumber(stats.total)}
            icon={IconBuilding}
          />
          <StatCard
            title='Landlords'
            description='Landlord-owned customers'
            value={formatNumber(stats.landlords)}
            icon={IconUser}
          />
          <StatCard
            title='Agencies'
            description='Agency-owned customers'
            value={formatNumber(stats.agencies)}
            icon={IconBriefcase}
          />
        </SimpleGrid>
      )}

      <Deferred data='orgs' fallback={<LoadingSkeleton type='table' />}>
        <AppCard
          title={
            <div className='flex items-center justify-between gap-2'>
              <span>All customers</span>
              <ExportButton
                href='/api/v1/orgs/export'
                query={{
                  search: String(query.search || ''),
                  includeTestAccounts,
                  favouritesOnly: favouritesOnly === true,
                  ownerRole: ownerRole ? String(ownerRole) : '',
                  sortBy,
                  sortOrder: String(sortOrder),
                }}
              />
            </div>
          }
          description={`${orgs?.meta?.total ?? 0} total`}>
          <div className='space-y-4'>
            <FilterSortBar
              filters={filterSortFields}
              sort={sortConfig}
              onFilterChange={handleFilterChange}
              onClear={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
              activeChips={activeChips}
            />
            <DataTable
              columns={columns}
              data={orgs?.data ?? []}
              searchable
              searchPlaceholder='Search by name or company...'
              searchValue={String(query.search || '')}
              onSearchChange={(value) => searchTable(String(value || ''))}
              pagination={tablePagination(orgs, {
                onPageChange: changePage,
                onPageSizeChange: changeRows,
              })}
              emptyMessage='No customers found'
              selectable
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              getRowId={(row) => String(row.id)}
              bulkActions={bulkActions}
            />
          </div>
        </AppCard>
      </Deferred>
    </DashboardPage>
  )
}
