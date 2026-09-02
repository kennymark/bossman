import { IconCoin, IconCreditCard, IconHourglass, IconTrendingDown } from '@tabler/icons-react'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'

import { formatCurrency, type TogethaCurrencies } from '#utils/currency'
import { formatNumber } from '#utils/functions'
import { StatCard } from '@/components/dashboard/stat-card'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/** Mirrors `RevenueStatsResult` in `app/services/revenue_service.ts`. */
export type RevenueStats =
  | { configured: false; appEnv: string }
  | {
      configured: true
      appEnv: string
      fetchedAt: string
      truncated: boolean
      mrr: {
        amount: number
        currency: string
        byCurrency: { currency: string; amount: number; subscriptions: number }[]
      }
      byStatus: Record<string, number>
      byPlan: { plan: string; count: number; mrr: number; currency: string }[]
      trialsEnding: {
        days: number
        count: number
        items: { id: string; customerId: string | null; plan: string; trialEnd: string }[]
      }
      churn: {
        startDate: string
        endDate: string
        canceled: number
        activeNow: number
        activeAtStart: number
        rate: number
      }
      monthly: { month: string; new: number; canceled: number }[]
      cohorts: { month: string; signups: number; retained: number; retention: number }[]
    }

const MOVEMENT_CHART_CONFIG = {
  new: { label: 'New', color: 'var(--chart-1)' },
  canceled: { label: 'Canceled', color: 'var(--chart-4)' },
} satisfies ChartConfig

function money(amount: number, currency: string) {
  const code = (currency || 'gbp').toUpperCase() as TogethaCurrencies
  return formatCurrency(amount, code)
}

function monthLabel(month: string) {
  const [year, m] = month.split('-').map(Number)
  return new Date(Date.UTC(year, (m ?? 1) - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })
}

interface RevenueSectionProps {
  data?: RevenueStats
  loading: boolean
  error?: boolean
  appEnv: string
}

export function RevenueSection({ data, loading, error, appEnv }: RevenueSectionProps) {
  const movement = useMemo(
    () =>
      data?.configured ? data.monthly.map((row) => ({ ...row, label: monthLabel(row.month) })) : [],
    [data],
  )

  if (loading) {
    return (
      <SimpleGrid cols={{ base: 1, md: 4 }} spacing={4}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-28 w-full' />
        ))}
      </SimpleGrid>
    )
  }

  if (error) {
    return (
      <AppCard title='Revenue' description='Stripe'>
        <p className='text-sm text-muted-foreground'>
          Could not reach Stripe for the {appEnv} environment. Try again shortly.
        </p>
      </AppCard>
    )
  }

  if (!data || !data.configured) {
    return (
      <AppCard title='Revenue' description='Stripe'>
        <p className='text-sm text-muted-foreground'>
          Stripe is not configured for the {appEnv} environment, so revenue figures are unavailable.
        </p>
      </AppCard>
    )
  }

  const activeSubs = (data.byStatus.active ?? 0) + (data.byStatus.past_due ?? 0)

  return (
    <div className='space-y-6'>
      <SimpleGrid cols={{ base: 1, md: 4 }} spacing={4}>
        <StatCard
          title='MRR'
          description={
            data.mrr.byCurrency.length > 1
              ? data.mrr.byCurrency.map((row) => money(row.amount, row.currency)).join(' · ')
              : 'Active and past-due subscriptions, yearly normalised'
          }
          value={money(data.mrr.amount, data.mrr.currency)}
          icon={IconCoin}
        />
        <StatCard
          title='Active subscriptions'
          description={`${formatNumber(data.byStatus.trialing ?? 0)} trialing · ${formatNumber(data.byStatus.past_due ?? 0)} past due`}
          value={formatNumber(activeSubs)}
          icon={IconCreditCard}
        />
        <StatCard
          title='Trials ending'
          description={`Next ${data.trialsEnding.days} days`}
          value={formatNumber(data.trialsEnding.count)}
          icon={IconHourglass}
        />
        <StatCard
          title='Churn rate'
          description={`${formatNumber(data.churn.canceled)} canceled of ${formatNumber(data.churn.activeAtStart)} in range`}
          value={`${data.churn.rate}%`}
          icon={IconTrendingDown}
        />
      </SimpleGrid>

      {data.truncated && (
        <p className='text-xs text-muted-foreground'>
          More than 1,000 subscriptions in at least one status; figures are a lower bound.
        </p>
      )}

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={4}>
        <AppCard title='New vs canceled' description='Last 6 months, by subscription'>
          <ChartContainer config={MOVEMENT_CHART_CONFIG} className='h-[220px] w-full'>
            <BarChart data={movement} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || !label) return null
                  return (
                    <div className='rounded-lg border border-border bg-card px-3 py-2 shadow-md'>
                      <p className='text-xs font-medium text-muted-foreground'>{label}</p>
                      {payload.map((entry) => (
                        <p key={String(entry.dataKey)} className='text-sm font-semibold'>
                          {entry.name}: {entry.value}
                        </p>
                      ))}
                    </div>
                  )
                }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey='new' fill='var(--color-new)' radius={[4, 4, 0, 0]} name='New' />
              <Bar
                dataKey='canceled'
                fill='var(--color-canceled)'
                radius={[4, 4, 0, 0]}
                name='Canceled'
              />
            </BarChart>
          </ChartContainer>
        </AppCard>

        <AppCard title='Plans' description='Live subscriptions by plan'>
          {data.byPlan.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No live subscriptions.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className='text-right'>Subscriptions</TableHead>
                  <TableHead className='text-right'>MRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byPlan.map((row) => (
                  <TableRow key={row.plan}>
                    <TableCell>
                      <Badge variant='outline' className='capitalize'>
                        {row.plan.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatNumber(row.count)}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {row.mrr > 0 ? money(row.mrr, row.currency) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AppCard>
      </SimpleGrid>

      <AppCard
        title='Cohort retention'
        description='Share of each signup month with an active subscription today (test accounts excluded)'>
        {data.cohorts.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No cohort data for this environment.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Signup month</TableHead>
                <TableHead className='text-right'>Signups</TableHead>
                <TableHead className='text-right'>Subscribed today</TableHead>
                <TableHead className='text-right'>Retention</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cohorts.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{monthLabel(row.month)}</TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatNumber(row.signups)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {formatNumber(row.retained)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>{row.retention}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AppCard>
    </div>
  )
}
