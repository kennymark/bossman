import type { SharedProps } from '@adonisjs/inertia/types'
import { Link } from '@inertiajs/react'
import {
  IconActivity,
  IconBriefcase,
  IconBuilding,
  IconChevronRight,
  IconInbox,
  IconUser,
  IconTool,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, subMonths, subYears } from 'date-fns'
import { useMemo, useState } from 'react'

import type { PaginatedResponse } from '#types/extra'
import type { RawActivity, RawLease, RawOrg } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { formatNumber } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { AnalyticsGrowthChart } from '@/components/dashboard/growth-chart'
import { StatCard } from '@/components/dashboard/stat-card'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { BaseSheet } from '@/components/ui/base-sheet'
import type { ChartConfig } from '@/components/ui/chart'
import { DatePresetPicker } from '@/components/ui/date-preset-picker'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/http'

const ANALYTICS_DATE_PRESETS = [
  { label: 'Last 7 days', getRange: () => ({ start: subDays(new Date(), 6), end: new Date() }) },
  { label: 'Last 30 days', getRange: () => ({ start: subDays(new Date(), 29), end: new Date() }) },
  {
    label: 'Last 3 months',
    getRange: () => ({ start: subMonths(new Date(), 2), end: new Date() }),
  },
  {
    label: 'Last 6 months',
    getRange: () => ({ start: subMonths(new Date(), 5), end: new Date() }),
  },
  { label: 'Last year', getRange: () => ({ start: subYears(new Date(), 1), end: new Date() }) },
]

const defaultEnd = new Date()
const defaultStart = subMonths(defaultEnd, 1)

function toYMD(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

type GrowthStats = {
  total: number
  growth: { date: string; count: number }[]
}

type OrgsStats = GrowthStats & { landlords: number; agencies: number }

const CHART_CONFIGS: Record<string, ChartConfig> = {
  orgs: { count: { label: 'Orgs', color: 'var(--chart-1)' } },
  users: { count: { label: 'Users', color: 'var(--chart-2)' } },
  leases: { count: { label: 'Leases', color: 'var(--chart-3)' } },
  maintenance: { count: { label: 'Requests', color: 'var(--chart-4)' } },
  activity: { count: { label: 'Activity', color: 'var(--chart-5)' } },
}

type EntityType = 'orgs' | 'users' | 'leases' | 'maintenance' | 'activity'

interface AnalyticsIndexProps extends SharedProps {}

export default function AnalyticsIndex(_props: AnalyticsIndexProps) {
  const [startDate, setStartDate] = useState(toYMD(defaultStart))
  const [endDate, setEndDate] = useState(toYMD(defaultEnd))
  const [entitiesSheetOpen, setEntitiesSheetOpen] = useState(false)
  const [entityType, setEntityType] = useState<EntityType>('orgs')
  const [entitiesPeriod, setEntitiesPeriod] = useState<{
    startDate: string
    endDate: string
    label: string
  } | null>(null)

  const dateRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate])

  const { data: orgsStats, isPending: orgsStatsLoading } = useQuery({
    queryKey: ['analytics-orgs-stats', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const res = await api.get<OrgsStats>('/analytics/orgs/stats', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      })
      return res.data
    },
  })

  const { data: usersStats, isPending: usersStatsLoading } = useQuery({
    queryKey: ['analytics-users-stats', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const res = await api.get<GrowthStats>('/analytics/users/stats', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      })
      return res.data
    },
  })

  const { data: leasesStats, isPending: leasesStatsLoading } = useQuery({
    queryKey: ['analytics-leases-stats', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const res = await api.get<GrowthStats>('/analytics/leases/stats', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      })
      return res.data
    },
  })

  const { data: maintenanceStats, isPending: maintenanceStatsLoading } = useQuery({
    queryKey: ['analytics-maintenance-stats', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const res = await api.get<GrowthStats>('/analytics/maintenance/stats', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      })
      return res.data
    },
  })

  const { data: activityStats, isPending: activityStatsLoading } = useQuery({
    queryKey: ['analytics-activity-stats', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const res = await api.get<GrowthStats>('/analytics/activity/stats', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      })
      return res.data
    },
  })

  const entitiesEndpoint = entityType && entitiesPeriod ? `/analytics/${entityType}/entities` : null

  const { data: entitiesData, isPending: entitiesLoading } = useQuery({
    queryKey: [
      'analytics-entities',
      entityType,
      entitiesPeriod?.startDate,
      entitiesPeriod?.endDate,
    ],
    queryFn: async () => {
      if (!entitiesPeriod || !entityType) return null
      // @ts-ignore
      const res = await api.get<PaginatedResponse<unknown>>(entitiesEndpoint!, {
        params: {
          startDate: entitiesPeriod.startDate,
          endDate: entitiesPeriod.endDate,
          perPage: 50,
        },
      })
      return res.data
    },
    enabled: !!entitiesEndpoint && entitiesSheetOpen,
  })

  const handleRangeChange = useMemo(
    () => (range: { startDate: string; endDate: string }) => {
      setStartDate(range.startDate)
      setEndDate(range.endDate)
    },
    [],
  )

  const handleBarClick =
    (type: EntityType) => (payload: { date: string; startDate: string; endDate: string }) => {
      setEntityType(type)
      setEntitiesPeriod({
        startDate: payload.startDate,
        endDate: payload.endDate,
        label: format(new Date(payload.date), 'PPP'),
      })
      setEntitiesSheetOpen(true)
    }

  const closeEntitiesSheet = () => {
    setEntitiesSheetOpen(false)
    setEntitiesPeriod(null)
  }

  const EntityIcon =
    entityType === 'orgs'
      ? IconBuilding
      : entityType === 'users'
        ? IconUser
        : entityType === 'leases'
          ? IconBriefcase
          : entityType === 'maintenance'
            ? IconTool
            : IconActivity

  const renderEntitiesList = () => {
    if (entitiesLoading) {
      return (
        <div className='flex flex-col gap-3 py-6'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className='flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3'
              aria-hidden>
              <div className='h-10 w-10 shrink-0 rounded-full bg-muted animate-pulse' />
              <div className='min-w-0 flex-1 space-y-1'>
                <div className='h-4 w-32 rounded bg-muted animate-pulse' />
                <div className='h-3 w-24 rounded bg-muted/70 animate-pulse' />
              </div>
            </div>
          ))}
        </div>
      )
    }
    const items = (entitiesData?.data ?? []) as Record<string, unknown>[]
    if (!items.length) {
      return (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 px-6 text-center'>
          <IconInbox className='text-muted-foreground mb-4 h-12 w-12' />
          <p className='text-sm font-medium'>No entities in this period</p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Try selecting a different date or range on the chart.
          </p>
        </div>
      )
    }
    const rowClass =
      'flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40 hover:border-muted-foreground/20'
    const linkRowClass =
      rowClass + ' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    return (
      <ScrollArea className='h-[60vh] pr-2'>
        <ul className='space-y-3'>
          {items.map((item) => {
            const id = String(item.id ?? '')
            const timeLabel = timeAgo(String(item.createdAt ?? ''))
            const iconWrap = (
              <span
                key={`${id}-icon`}
                className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted'>
                <EntityIcon className='text-muted-foreground h-5 w-5' />
              </span>
            )
            if (entityType === 'orgs') {
              const org = item as unknown as RawOrg
              return (
                <li key={id}>
                  <Link href={`/orgs/${id}`} className={linkRowClass}>
                    {iconWrap}
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium truncate'>{org.cleanName ?? org.name}</p>
                      <p className='text-muted-foreground text-xs'>Created {timeLabel}</p>
                    </div>
                    <Badge variant='outline' className='capitalize shrink-0'>
                      {org.ownerRole}
                    </Badge>
                    <IconChevronRight className='text-muted-foreground h-4 w-4 shrink-0' />
                  </Link>
                </li>
              )
            }
            if (entityType === 'users') {
              const name = String(item.name ?? item.email ?? id)
              return (
                <li key={id}>
                  <div className={rowClass}>
                    {iconWrap}
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium truncate'>{name}</p>
                      <p className='text-muted-foreground truncate text-xs'>
                        {item.email ? String(item.email) : `Created ${timeLabel}`}
                      </p>
                    </div>
                    <p className='text-muted-foreground shrink-0 text-xs'>{timeLabel}</p>
                  </div>
                </li>
              )
            }
            if (entityType === 'leases') {
              const lease = item as unknown as RawLease
              return (
                <li key={id}>
                  <Link href={`/leases/${id}`} className={linkRowClass}>
                    {iconWrap}
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium truncate'>{lease.name ?? lease.shortId ?? id}</p>
                      <p className='text-muted-foreground text-xs'>Created {timeLabel}</p>
                    </div>
                    <Badge variant='outline' className='shrink-0'>
                      {lease.status}
                    </Badge>
                    <IconChevronRight className='text-muted-foreground h-4 w-4 shrink-0' />
                  </Link>
                </li>
              )
            }
            if (entityType === 'maintenance') {
              const title = String(item.title ?? id)
              return (
                <li key={id}>
                  <div className={rowClass}>
                    {iconWrap}
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium truncate'>{title}</p>
                      <p className='text-muted-foreground text-xs'>Created {timeLabel}</p>
                    </div>
                    {item.status != null ? (
                      <Badge variant='outline' className='shrink-0 capitalize'>
                        {String(item.status).replace('_', ' ')}
                      </Badge>
                    ) : null}
                  </div>
                </li>
              )
            }
            if (entityType === 'activity') {
              const act = item as unknown as RawActivity
              return (
                <li key={id}>
                  <div className={rowClass}>
                    {iconWrap}
                    <div className='min-w-0 flex-1'>
                      <p className='font-medium line-clamp-2'>{act.summary ?? '—'}</p>
                      <p className='text-muted-foreground text-xs'>{timeLabel}</p>
                    </div>
                    <Badge variant='secondary' className='shrink-0 capitalize'>
                      {act.type}
                    </Badge>
                  </div>
                </li>
              )
            }
            return null
          })}
        </ul>
        {entitiesData &&
          (entitiesData.metadata ?? entitiesData.meta)?.total != null &&
          (entitiesData.metadata ?? entitiesData.meta)!.total > entitiesData.data.length && (
            <div className='text-muted-foreground mt-4 rounded-lg bg-muted/30 px-3 py-2 text-center text-xs'>
              Showing {entitiesData.data.length} of{' '}
              {(entitiesData.metadata ?? entitiesData.meta)!.total} — scroll for more
            </div>
          )}
      </ScrollArea>
    )
  }

  const sheetTitles: Record<EntityType, string> = {
    orgs: 'Orgs',
    users: 'Togetha users',
    leases: 'Leases',
    maintenance: 'Maintenance requests',
    activity: 'Activity',
  }

  return (
    <DashboardPage
      title='Analytics'
      description='Stats and growth trends by entity type. Test accounts are excluded from orgs.'
      actions={
        <DatePresetPicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={handleRangeChange}
          presets={ANALYTICS_DATE_PRESETS}
          placeholder='Select date range'
          buttonClassName='min-w-[200px]'
          buttonSize='sm'
        />
      }>
      <Tabs defaultValue='orgs' className='space-y-6'>
        <TabsList className='w-fit h-auto flex-wrap gap-1'>
          <TabsTrigger value='orgs' className='gap-2 rounded-md'>
            <IconBuilding className='h-4 w-4' />
            Orgs
          </TabsTrigger>
          <TabsTrigger value='togetha_users' className='gap-2 rounded-md'>
            <IconUser className='h-4 w-4' />
            Users
          </TabsTrigger>
          <TabsTrigger value='leases' className='gap-2 rounded-md'>
            <IconBriefcase className='h-4 w-4' />
            Leases
          </TabsTrigger>
          <TabsTrigger value='maintenance' className='gap-2 rounded-md'>
            <IconTool className='h-4 w-4' />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value='activity' className='gap-2 rounded-md'>
            <IconActivity className='h-4 w-4' />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value='orgs' className='space-y-6 mt-0'>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing={4}>
            <StatCard
              title='Total'
              description='Orgs created in period'
              value={formatNumber(orgsStats?.total)}
              icon={IconBuilding}
            />
            <StatCard
              title='Landlords'
              description='Landlord orgs'
              value={formatNumber(orgsStats?.landlords)}
              icon={IconUser}
            />
            <StatCard
              title='Agencies'
              description='Agency orgs'
              value={formatNumber(orgsStats?.agencies)}
              icon={IconBriefcase}
            />
          </SimpleGrid>
          {orgsStatsLoading ? (
            <AppCard title='Growth' description='Loading…'>
              <div className='h-[240px] flex items-center justify-center text-muted-foreground text-sm'>
                Loading…
              </div>
            </AppCard>
          ) : (
            <AnalyticsGrowthChart
              title='Orgs created'
              startDate={startDate}
              endDate={endDate}
              data={orgsStats?.growth ?? []}
              config={CHART_CONFIGS.orgs}
              onBarClick={handleBarClick('orgs')}
            />
          )}
        </TabsContent>

        <TabsContent value='togetha_users' className='space-y-6 mt-0'>
          <SimpleGrid cols={{ base: 1, md: 1 }} spacing={4}>
            <StatCard
              title='Total'
              description='Users created in period'
              value={formatNumber(usersStats?.total)}
              icon={IconUser}
            />
          </SimpleGrid>
          {usersStatsLoading ? (
            <AppCard title='Growth' description='Loading…'>
              <div className='h-[240px] flex items-center justify-center text-muted-foreground text-sm'>
                Loading…
              </div>
            </AppCard>
          ) : (
            <AnalyticsGrowthChart
              title='Users created'
              startDate={startDate}
              endDate={endDate}
              data={usersStats?.growth ?? []}
              config={CHART_CONFIGS.users}
              onBarClick={handleBarClick('users')}
            />
          )}
        </TabsContent>

        <TabsContent value='leases' className='space-y-6 mt-0'>
          <SimpleGrid cols={{ base: 1, md: 1 }} spacing={4}>
            <StatCard
              title='Total'
              description='Leases created in period'
              value={formatNumber(leasesStats?.total)}
              icon={IconBriefcase}
            />
          </SimpleGrid>
          {leasesStatsLoading ? (
            <AppCard title='Growth' description='Loading…'>
              <div className='h-[240px] flex items-center justify-center text-muted-foreground text-sm'>
                Loading…
              </div>
            </AppCard>
          ) : (
            <AnalyticsGrowthChart
              title='Leases created'
              startDate={startDate}
              endDate={endDate}
              data={leasesStats?.growth ?? []}
              config={CHART_CONFIGS.leases}
              onBarClick={handleBarClick('leases')}
            />
          )}
        </TabsContent>

        <TabsContent value='maintenance' className='space-y-6 mt-0'>
          <SimpleGrid cols={{ base: 1, md: 1 }} spacing={4}>
            <StatCard
              title='Total'
              description='Maintenance requests in period'
              value={formatNumber(maintenanceStats?.total)}
              icon={IconTool}
            />
          </SimpleGrid>
          {maintenanceStatsLoading ? (
            <AppCard title='Growth' description='Loading…'>
              <div className='h-[240px] flex items-center justify-center text-muted-foreground text-sm'>
                Loading…
              </div>
            </AppCard>
          ) : (
            <AnalyticsGrowthChart
              title='Maintenance requests'
              startDate={startDate}
              endDate={endDate}
              data={maintenanceStats?.growth ?? []}
              config={CHART_CONFIGS.maintenance}
              onBarClick={handleBarClick('maintenance')}
            />
          )}
        </TabsContent>

        <TabsContent value='activity' className='space-y-6 mt-0'>
          <SimpleGrid cols={{ base: 1, md: 1 }} spacing={4}>
            <StatCard
              title='Total'
              description='Activity in period'
              value={formatNumber(activityStats?.total)}
              icon={IconActivity}
            />
          </SimpleGrid>
          {activityStatsLoading ? (
            <AppCard title='Growth' description='Loading…'>
              <div className='h-[240px] flex items-center justify-center text-muted-foreground text-sm'>
                Loading…
              </div>
            </AppCard>
          ) : (
            <AnalyticsGrowthChart
              title='Activity'
              startDate={startDate}
              endDate={endDate}
              data={activityStats?.growth ?? []}
              config={CHART_CONFIGS.activity}
              onBarClick={handleBarClick('activity')}
            />
          )}
        </TabsContent>
      </Tabs>

      <BaseSheet
        title={
          entitiesPeriod
            ? `${sheetTitles[entityType]} — ${entitiesPeriod.label}`
            : sheetTitles[entityType]
        }
        description={
          entitiesPeriod ? `${entitiesPeriod.startDate} – ${entitiesPeriod.endDate}` : undefined
        }
        open={entitiesSheetOpen}
        onOpenChange={(open) => !open && closeEntitiesSheet()}
        side='right'
        showFooter={false}>
        {renderEntitiesList()}
      </BaseSheet>
    </DashboardPage>
  )
}
