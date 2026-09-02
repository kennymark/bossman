import type { SharedProps } from '@adonisjs/inertia/types'
import {
  IconBuilding,
  IconCalendarEvent,
  IconCalendarOff,
  IconCreditCardOff,
  IconFileCertificate,
  IconFileText,
  IconTool,
  IconUsers,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { PaginatedResponse } from '#types/extra'
import type { RawActivity } from '#types/model-types'
import { formatCurrency, type TogethaCurrencies } from '#utils/currency'
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

import { AttentionCard, type AttentionResult } from './components/attention-card'

type SignupWindow = { today: number; last7Days: number; last30Days: number }

/** Mirrors `DashboardStats` in `app/services/dashboard_service.ts`. */
type DashboardStats = {
  signups: { users: SignupWindow; orgs: SignupWindow }
  leases: { active: number; startingNext7Days: number; endingNext30Days: number }
  payments: {
    problemLast7Days: {
      count: number
      byCurrency: { currency: string; count: number; total: number }[]
    }
  }
  maintenance: { open: number; overdue: number }
  compliance: { expiringNext30Days: number }
  growth: {
    usersByDay: { date: string; count: number }[]
    tenanciesByDay: { date: string; count: number }[]
    activityByWeek: { date: string; count: number }[]
  }
  degraded: string[]
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

function windowDescription(window?: SignupWindow) {
  if (!window) return 'Today'
  return `Today · ${formatNumber(window.last7Days)} in 7 days · ${formatNumber(window.last30Days)} in 30 days`
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
      {children}
    </h2>
  )
}

export default function DashboardIndex(_props: DashboardIndexProps) {
  const [activityPage, setActivityPage] = useState(1)
  const [activityPerPage, setActivityPerPage] = useState(20)

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      /** The registry still types the previous payload; the service defines this one. */
      const res = (await api.dashboard.stats({})) as unknown as { data: DashboardStats }
      return res.data
    },
  })

  const {
    data: attention,
    isPending: attentionLoading,
    isError: attentionError,
  } = useQuery({
    queryKey: ['dashboard-attention'],
    queryFn: async () => (await api.dashboard.attention({})) as unknown as AttentionResult,
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

  const activities = activityData?.data ?? []
  const activityMeta = activityData?.meta

  const payments = stats?.payments.problemLast7Days
  const paymentTotals = payments?.byCurrency.length
    ? payments.byCurrency
        .map((row) => formatCurrency(row.total, row.currency as TogethaCurrencies))
        .join(' · ')
    : 'Nothing outstanding'

  return (
    <DashboardPage title='Welcome back' description="Here's what needs an operator this morning.">
      <AttentionCard data={attention} loading={attentionLoading} error={attentionError} />

      {stats && stats.degraded.length > 0 && (
        <p className='text-xs text-muted-foreground'>
          Some figures are unavailable for this environment: {stats.degraded.join(', ')}.
        </p>
      )}

      <div className='space-y-3'>
        <SectionHeading>Signups</SectionHeading>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={4}>
          <StatCard
            title='New users'
            description={windowDescription(stats?.signups.users)}
            value={formatNumber(stats?.signups.users.today ?? 0)}
            icon={IconUsers}
          />
          <StatCard
            title='New orgs'
            description={windowDescription(stats?.signups.orgs)}
            value={formatNumber(stats?.signups.orgs.today ?? 0)}
            icon={IconBuilding}
          />
        </SimpleGrid>
      </div>

      <div className='space-y-3'>
        <SectionHeading>Leases</SectionHeading>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={4}>
          <StatCard
            title='Active leases'
            description='Not archived'
            value={formatNumber(stats?.leases.active ?? 0)}
            icon={IconFileText}
          />
          <StatCard
            title='Starting soon'
            description='Next 7 days'
            value={formatNumber(stats?.leases.startingNext7Days ?? 0)}
            icon={IconCalendarEvent}
          />
          <StatCard
            title='Ending soon'
            description='Next 30 days'
            value={formatNumber(stats?.leases.endingNext30Days ?? 0)}
            icon={IconCalendarOff}
          />
        </SimpleGrid>
      </div>

      <div className='space-y-3'>
        <SectionHeading>Money</SectionHeading>
        <SimpleGrid cols={{ base: 1, md: 1 }} spacing={4}>
          <StatCard
            title='Problem payments'
            description={`Failed, unpaid or overdue, due in the last 7 days · ${paymentTotals}`}
            value={formatNumber(payments?.count ?? 0)}
            icon={IconCreditCardOff}
          />
        </SimpleGrid>
      </div>

      <div className='space-y-3'>
        <SectionHeading>Ops</SectionHeading>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={4}>
          <StatCard
            title='Open maintenance'
            description={`${formatNumber(stats?.maintenance.overdue ?? 0)} overdue`}
            value={formatNumber(stats?.maintenance.open ?? 0)}
            icon={IconTool}
          />
          <StatCard
            title='Compliance expiring'
            description='Documents expiring in the next 30 days'
            value={formatNumber(stats?.compliance.expiringNext30Days ?? 0)}
            icon={IconFileCertificate}
          />
        </SimpleGrid>
      </div>

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
