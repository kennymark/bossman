import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Building2, Plus, User } from 'lucide-react'
import type { Column, PaginatedResponse } from '#types/extra'
import type { RawOrg } from '#types/model-types'
import { formatNumber } from '#utils/functions'
import { DataTable } from '@/components/dashboard/data-table'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import api from '@/lib/http'

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
]

interface OrgsIndexProps extends SharedProps {
  orgs: PaginatedResponse<RawOrg>
}

export default function OrgsIndex({ orgs }: OrgsIndexProps) {
  const { changePage, changeRows, searchTable, query } = useInertiaParams({
    page: 1,
    perPage: 20,
    search: '',
  })

  const { data: stats } = useQuery({
    queryKey: ['orgs-stats'],
    queryFn: async () => {
      const res = await api.get<OrgsStats>('/orgs/stats')
      return res.data
    },
  })

  return (
    <DashboardLayout>
      <Head title='Orgs' />
      <div className='space-y-6'>
        <PageHeader
          title='Customers'
          description='View and manage customers.'
          actions={
            <Button asChild>
              <Link href='/orgs/create'>
                <Plus className='mr-2 h-4 w-4' />
                Create
              </Link>
            </Button>
          }
        />

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={4}>
          <StatCard
            title='Total'
            description='All customers'
            value={formatNumber(stats?.total)}
            icon={Building2}
          />
          <StatCard
            title='Landlords'
            description='Landlord-owned customers'
            value={formatNumber(stats?.landlords)}
            icon={User}
          />
          <StatCard
            title='Agencies'
            description='Agency-owned customers'
            value={formatNumber(stats?.agencies)}
            icon={Briefcase}
          />
        </SimpleGrid>

        <Card>
          <CardHeader>
            <CardTitle>All customers</CardTitle>
            <CardDescription>{orgs.meta.total} total</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={orgs.data}
              searchable
              searchPlaceholder='Search by name or company...'
              searchValue={String(query.search || '')}
              onSearchChange={(value) => searchTable(String(value || ''))}
              pagination={{
                page: orgs.meta.currentPage,
                pageSize: orgs.meta.perPage,
                total: orgs.meta.total,
                onPageChange: changePage,
                onPageSizeChange: changeRows,
              }}
              emptyMessage='No customers found'
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
