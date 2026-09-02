import type { SharedProps } from '@adonisjs/inertia/types'
import { IconActivity, IconFileText, IconUsers } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { PaginatedResponse } from '#types/extra'
import type { RawActivity } from '#types/model-types'
import { formatNumber } from '#utils/functions'
import { activityColumns } from '@/components/dashboard/activity-columns'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { ActivityPerWeekChart, GrowthChart } from '@/components/dashboard/growth-chart'
import { StatCard } from '@/components/dashboard/stat-card'
import { AppCard } from '@/components/ui/app-card'
import type { ChartConfig } from '@/components/ui/chart'
import { SimpleGrid } from '@/components/ui/simplegrid'
import api, { paginated } from '@/lib/http'
import { tablePaginationFromMeta } from '@/lib/pagination'

type DashboardStats = {
  totalUsers: number
  totalTenancies: number
  totalActivity: number
  growth: {
    usersByDay: { date: string; count: number }[]
    tenanciesByDay: { date: string; count: number }[]
    activityByWeek: { date: string; count: number }[]
  }
}

const usersChartConfig = {
  count: { label: 'Users', color: 'var(--chart-1)' },
} satisfies ChartConfig

const tenanciesChartConfig = {
  count: { label: 'Tenancies', color: 'var(--chart-2)' },
} satisfies ChartConfig

const activityChartConfig = {
  count: { label: 'Activity', color: 'var(--chart-3)' },
} satisfies ChartConfig

interface DashboardIndexProps extends SharedProps {}

export default function DashboardIndex(_props: DashboardIndexProps) {
  const [activityPage, setActivityPage] = useState(1)
  const [activityPerPage, setActivityPerPage] = useState(20)

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      return await api.dashboard.stats({})
    },
    select: (res) => res?.data,
  })

  const { data: activityData, isPending: activityLoading } = useQuery({
    queryKey: ['dashboard-activity', activityPage, activityPerPage],
    queryFn: async () => {
      const res = await api.dashboard.recentActivity({
        query: { page: String(activityPage), perPage: String(activityPerPage) },
      })
      /** Serialized on the wire; the inferred row type is the Lucid model. */
      return paginated(res) as unknown as PaginatedResponse<RawActivity>
    },
  })

  const stats = statsData
  const activities = activityData?.data ?? []
  const activityMeta = activityData?.meta

  return (
    <DashboardPage title='Welcome back' description="Here's what's happening on the platform.">
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing={4}>
        <StatCard
          title='Total users'
          description='Registered users'
          value={formatNumber(stats?.totalUsers ?? 0)}
          icon={IconUsers}
        />
        <StatCard
          title='Total tenancies'
          description='Active and past leases'
          value={formatNumber(stats?.totalTenancies ?? 0)}
          icon={IconFileText}
        />
        <StatCard
          title='Total activity'
          description='Activity events recorded'
          value={formatNumber(stats?.totalActivity ?? 0)}
          icon={IconActivity}
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
      <ActivityPerWeekChart
        title='Activity per week'
        data={stats?.growth?.activityByWeek ?? []}
        config={activityChartConfig}
      />

      <AppCard title='Recent activity' description='Latest activity across the platform.'>
        <DataTable
          columns={activityColumns}
          data={activities}
          loading={activityLoading}
          emptyMessage='No activity yet.'
          pagination={tablePaginationFromMeta(activityMeta, {
            onPageChange: setActivityPage,
            onPageSizeChange: setActivityPerPage,
          })}
        />
      </AppCard>
    </DashboardPage>
  )
}
