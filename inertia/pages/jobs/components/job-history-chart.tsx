import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'

import type { JobHistory, JobHistoryPoint } from '#types/jobs'
import { DEFAULT_HISTORY_DAYS } from '#utils/jobs'
import { AppCard } from '@/components/ui/app-card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'
import { LoadingSkeleton } from '@/components/ui/loading'

const config = {
  count: { label: 'Runs', color: 'var(--chart-1)' },
  failedCount: { label: 'Failed', color: 'var(--destructive)' },
} satisfies ChartConfig

type Point = JobHistoryPoint & { label: string }

function labelFor(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export interface JobHistoryChartProps {
  history?: JobHistory
  isLoading: boolean
}

/**
 * Jobs finished per day, with failures as a second series.
 *
 * Days are UTC — the store's timestamps are — so a bar is "what the workers did on
 * that calendar day", not what this browser's timezone would call it.
 */
export function JobHistoryChart({ history, isLoading }: JobHistoryChartProps) {
  const data = useMemo<Point[]>(
    () => (history?.points ?? []).map((point) => ({ ...point, label: labelFor(point.date) })),
    [history],
  )
  const days = history?.days ?? DEFAULT_HISTORY_DAYS

  return (
    <AppCard
      title='Runs per day'
      description={`Jobs finished each day over the last ${days} days (UTC)`}>
      {isLoading ? (
        <LoadingSkeleton type='table' count={4} />
      ) : (
        <ChartContainer config={config} className='h-[240px] w-full'>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length || !label) return null
                const point = payload[0]?.payload as Point | undefined
                return (
                  <div className='rounded-lg border border-border bg-card px-3 py-2 shadow-md'>
                    <p className='text-xs font-medium text-muted-foreground'>{label}</p>
                    <p className='text-sm font-semibold'>Runs: {point?.count ?? 0}</p>
                    <p className='text-sm font-semibold text-destructive'>
                      Failed: {point?.failedCount ?? 0}
                    </p>
                    {point?.topJob && (
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Busiest: {point.topJob.name} ({point.topJob.count})
                      </p>
                    )}
                  </div>
                )
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey='count' fill='var(--color-count)' radius={[4, 4, 0, 0]} name='Runs' />
            <Bar
              dataKey='failedCount'
              fill='var(--color-failedCount)'
              radius={[4, 4, 0, 0]}
              name='Failed'
            />
          </BarChart>
        </ChartContainer>
      )}
    </AppCard>
  )
}
