import type { SharedProps } from '@adonisjs/inertia/types'
import { Head } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { Activity, FileText, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Column, PaginatedResponse } from '#types/extra'
import type { RawActivity } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { formatNumber } from '#utils/functions'
import { DataTable } from '@/components/dashboard/data-table'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { dateFormatter } from '@/lib/date'
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

function last7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function GrowthChart({
  title,
  data,
  colorClass = 'bg-primary',
}: {
  title: string
  data: { date: string; count: number }[]
  colorClass?: string
}) {
  const days = useMemo(() => last7Days(), [])
  const byDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data) map.set(d.date, d.count)
    return map
  }, [data])
  const maxCount = useMemo(() => {
    const values = days.map((d) => byDate.get(d) ?? 0)
    return Math.max(1, ...values)
  }, [days, byDate])

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-end gap-1 h-[120px]'>
          {days.map((day) => {
            const count = byDate.get(day) ?? 0
            const height = maxCount ? (count / maxCount) * 100 : 0
            return (
              <div
                key={day}
                className='flex-1 flex flex-col items-center gap-1'
                title={`${day}: ${count}`}>
                <div
                  className={`w-full rounded-t transition-all ${colorClass} min-h-[4px]`}
                  style={{ height: `${height}%` }}
                />
                <span className='text-[10px] text-muted-foreground truncate max-w-full'>
                  {new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

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
            colorClass='bg-blue-500'
          />
          <GrowthChart
            title='New tenancies'
            data={stats?.growth?.tenanciesByDay ?? []}
            colorClass='bg-emerald-500'
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
