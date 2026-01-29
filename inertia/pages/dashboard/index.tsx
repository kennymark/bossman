import type { SharedProps } from '@adonisjs/inertia/types'
import { Head } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { Activity, FileText, Users } from 'lucide-react'
import { useState } from 'react'
import type { Column, PaginatedResponse } from '#types/extra'
import type { RawActivity } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { formatNumber } from '#utils/functions'
import { DataTable } from '@/components/dashboard/data-table'
import { GrowthChart } from '@/components/dashboard/growth-chart'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import { SimpleGrid } from '@/components/ui/simplegrid'
import api from '@/lib/http'

type DashboardStats = {
  totalUsers: number
  totalTenancies: number
  totalActivity: number
  growth: {
    usersByDay: { date: string; count: number }[]
    tenanciesByDay: { date: string; count: number }[]
  }
}

const activityColumns: Column<RawActivity>[] = [
  { key: 'summary', header: 'Summary' },
  {
    key: 'type',
    header: 'Type',
    width: 120,
    cell: (row) => (
      <Badge variant='secondary' className='capitalize'>
        {row.type ?? '—'}
      </Badge>
    ),
  },
  {
    key: 'isSystemAction',
    header: 'Source',
    width: 190,
    cell: (row) =>
      row.isSystemAction ? (
        <Badge variant='secondary'>System</Badge>
      ) : (
        <Badge variant='outline'>{row.user?.name ?? '—'}</Badge>
      ),
  },
  {
    key: 'createdAt',
    header: 'When',
    width: 140,
    cell: (row) => (row.createdAt ? timeAgo(row.createdAt) : '—'),
  },
]

const usersChartConfig = {
  count: { label: 'Users', color: 'var(--chart-1)' },
} satisfies ChartConfig

const tenanciesChartConfig = {
  count: { label: 'Tenancies', color: 'var(--chart-2)' },
} satisfies ChartConfig

interface DashboardIndexProps extends SharedProps { }

export default function DashboardIndex(_props: DashboardIndexProps) {
  const [activityPage, setActivityPage] = useState(1)
  const [activityPerPage, setActivityPerPage] = useState(20)

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardStats }>('/dashboard/stats')
      return res.data
    },
    select: (data) => data?.data,
  })

  const { data: activityData, isPending: activityLoading } = useQuery({
    queryKey: ['dashboard-activity', activityPage, activityPerPage],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<RawActivity>>('/dashboard/activity', {
        params: { page: activityPage, perPage: activityPerPage },
      })
      return res.data
    },
  })

  const stats = statsData
  const activities = activityData?.data ?? []
  const activityMeta = activityData?.meta

  return (
    <DashboardLayout>
      <Head title='Dashboard' />
      <div className='space-y-6'>
        <PageHeader title='Welcome back' description="Here's what's happening on the platform." />

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={4}>
          <StatCard
            title='Total users'
            description='Registered users'
            value={formatNumber(stats?.totalUsers ?? 0)}
            icon={Users}
          />
          <StatCard
            title='Total tenancies'
            description='Active and past leases'
            value={formatNumber(stats?.totalTenancies ?? 0)}
            icon={FileText}
          />
          <StatCard
            title='Total activity'
            description='Activity events recorded'
            value={formatNumber(stats?.totalActivity ?? 0)}
            icon={Activity}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={4}>
          <GrowthChart
            title='New users'
            data={stats?.growth?.usersByDay ?? []}
            config={usersChartConfig}
          />
          <GrowthChart
            title='New tenancies'
            data={stats?.growth?.tenanciesByDay ?? []}
            config={tenanciesChartConfig}
          />
        </SimpleGrid>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest activity across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={activityColumns}
              data={activities}
              loading={activityLoading}
              emptyMessage='No activity yet.'
              pagination={
                activityMeta
                  ? {
                    page: activityMeta.currentPage,
                    pageSize: activityMeta.perPage,
                    total: activityMeta.total,
                    onPageChange: setActivityPage,
                    onPageSizeChange: (size) => {
                      setActivityPerPage(size)
                      setActivityPage(1)
                    },
                  }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
