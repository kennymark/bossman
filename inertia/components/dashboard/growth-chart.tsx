'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import { AppCard } from '@/components/ui/app-card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'

function last7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function buildChartData(
  data: { date: string; count: number }[],
): { date: string; label: string; count: number }[] {
  const days = last7Days()
  const byDate = new Map<string, number>()
  for (const d of data) byDate.set(d.date, d.count)
  return days.map((date) => ({
    date,
    label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: byDate.get(date) ?? 0,
  }))
}

export type GrowthChartProps = {
  title: string
  data: { date: string; count: number }[]
  config: ChartConfig
}

function last10Weeks(): string[] {
  const weeks: string[] = []
  for (let i = 9; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d)
    monday.setDate(diff)
    weeks.push(monday.toISOString().slice(0, 10))
  }
  return weeks
}

function buildWeekChartData(
  data: { date: string; count: number }[],
): { date: string; label: string; count: number }[] {
  const weeks = last10Weeks()
  const byWeek = new Map<string, number>()
  for (const d of data) byWeek.set(d.date.slice(0, 10), d.count)
  return weeks.map((date) => ({
    date,
    label: `Week of ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    count: byWeek.get(date) ?? 0,
  }))
}

export type ActivityPerWeekChartProps = {
  title: string
  data: { date: string; count: number }[]
  config: ChartConfig
}

export function ActivityPerWeekChart({ title, data, config }: ActivityPerWeekChartProps) {
  const chartData = useMemo(() => buildWeekChartData(data), [data])
  const seriesLabel = config.count?.label ?? 'Activity'

  return (
    <AppCard title={title} description='Last 10 weeks'>
      <ChartContainer config={config} className='h-[200px] w-full'>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} />
          <XAxis
            dataKey='label'
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length || !label) return null
              const value = payload[0]?.value ?? 0
              return (
                <div className='rounded-lg border border-border bg-card px-3 py-2 shadow-md'>
                  <p className='text-xs font-medium text-muted-foreground'>{label}</p>
                  <p className='text-sm font-semibold'>
                    {seriesLabel}: {value}
                  </p>
                </div>
              )
            }}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          />
          <Bar dataKey='count' fill='var(--color-count)' radius={[4, 4, 0, 0]} name={seriesLabel} />
        </BarChart>
      </ChartContainer>
    </AppCard>
  )
}

export function GrowthChart({ title, data, config }: GrowthChartProps) {
  const chartData = useMemo(() => buildChartData(data), [data])
  const seriesLabel = config.count?.label ?? 'Count'

  return (
    <AppCard title={title} description='Last 7 days'>
      <ChartContainer config={config} className='h-[200px] w-full'>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} />
          <XAxis
            dataKey='label'
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length || !label) return null
              const value = payload[0]?.value ?? 0
              return (
                <div className='rounded-lg border border-border bg-card px-3 py-2 shadow-md'>
                  <p className='text-xs font-medium text-muted-foreground'>{label}</p>
                  <p className='text-sm font-semibold'>
                    {seriesLabel}: {value}
                  </p>
                </div>
              )
            }}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          />
          <Bar dataKey='count' fill='var(--color-count)' radius={[4, 4, 0, 0]} name={seriesLabel} />
        </BarChart>
      </ChartContainer>
    </AppCard>
  )
}

function daysInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days: string[] = []
  const d = new Date(start)
  while (d <= end) {
    days.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return days
}

const WEEKLY_VIEW_DAYS_THRESHOLD = 31 // above this use weekly until monthly
const MONTHLY_VIEW_DAYS_THRESHOLD = 90

/** Monday = 1, Sunday = 0. Get Monday on or before d. */
function getMonday(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay()
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1)
  copy.setDate(diff)
  return copy
}

function weeksInRange(
  startDate: string,
  endDate: string,
): { weekKey: string; label: string; start: string; end: string }[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const weeks: { weekKey: string; label: string; start: string; end: string }[] = []
  const monday = new Date(getMonday(start))
  while (monday <= end) {
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const rangeStart = monday < start ? start : monday
    const rangeEnd = sunday > end ? end : sunday
    const startStr = rangeStart.toISOString().slice(0, 10)
    const endStr = rangeEnd.toISOString().slice(0, 10)
    weeks.push({
      weekKey: startStr,
      label: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      start: startStr,
      end: endStr,
    })
    monday.setDate(monday.getDate() + 7)
  }
  return weeks
}

function buildWeeklyChartData(
  startDate: string,
  endDate: string,
  data: { date: string; count: number }[],
): { date: string; label: string; count: number; startDate: string; endDate: string }[] {
  const weeks = weeksInRange(startDate, endDate)
  const byDate = new Map<string, number>()
  for (const d of data) byDate.set(d.date.slice(0, 10), d.count)
  return weeks.map(({ weekKey, label, start, end }) => {
    let count = 0
    const d = new Date(start)
    while (d <= new Date(end)) {
      count += byDate.get(d.toISOString().slice(0, 10)) ?? 0
      d.setDate(d.getDate() + 1)
    }
    return { date: weekKey, label, count, startDate: start, endDate: end }
  })
}

function monthsInRange(
  startDate: string,
  endDate: string,
): { monthKey: string; label: string; start: string; end: string }[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months: { monthKey: string; label: string; start: string; end: string }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end) {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const monthStart = new Date(y, m, 1)
    const monthEnd = new Date(y, m + 1, 0)
    const rangeStart = monthStart < start ? start : monthStart
    const rangeEnd = monthEnd > end ? end : monthEnd
    months.push({
      monthKey: `${y}-${String(m + 1).padStart(2, '0')}`,
      label: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      start: rangeStart.toISOString().slice(0, 10),
      end: rangeEnd.toISOString().slice(0, 10),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months
}

function buildMonthlyChartData(
  startDate: string,
  endDate: string,
  data: { date: string; count: number }[],
): { date: string; label: string; count: number; startDate: string; endDate: string }[] {
  const months = monthsInRange(startDate, endDate)
  const byDate = new Map<string, number>()
  for (const d of data) byDate.set(d.date.slice(0, 10), d.count)
  return months.map(({ monthKey, label, start, end }) => {
    let count = 0
    const d = new Date(start)
    while (d <= new Date(end)) {
      count += byDate.get(d.toISOString().slice(0, 10)) ?? 0
      d.setDate(d.getDate() + 1)
    }
    return { date: monthKey, label, count, startDate: start, endDate: end }
  })
}

export type AnalyticsGrowthChartProps = {
  title: string
  startDate: string
  endDate: string
  data: { date: string; count: number }[]
  config: ChartConfig
  onBarClick?: (payload: { date: string; startDate: string; endDate: string }) => void
}

export function AnalyticsGrowthChart({
  title,
  startDate,
  endDate,
  data,
  config,
  onBarClick,
}: AnalyticsGrowthChartProps) {
  const chartData = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1

    if (daysCount > MONTHLY_VIEW_DAYS_THRESHOLD) {
      return buildMonthlyChartData(startDate, endDate, data)
    }
    if (daysCount > WEEKLY_VIEW_DAYS_THRESHOLD) {
      return buildWeeklyChartData(startDate, endDate, data)
    }

    const days = daysInRange(startDate, endDate)
    const byDate = new Map<string, number>()
    for (const d of data) byDate.set(d.date.slice(0, 10), d.count)
    return days.map((date) => ({
      date,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: byDate.get(date) ?? 0,
      startDate: date,
      endDate: date,
    }))
  }, [startDate, endDate, data])

  const seriesLabel = config.count?.label ?? 'Count'

  const handleBarClick = onBarClick
    ? (entry: {
        date: string
        label: string
        count: number
        startDate?: string
        endDate?: string
      }) => {
        const start = entry.startDate ?? entry.date
        const end = entry.endDate ?? entry.date
        onBarClick({ date: entry.date, startDate: start, endDate: end })
      }
    : undefined

  return (
    <AppCard
      title={title}
      description={`${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}`}>
      <ChartContainer config={config} className='h-[200px] w-full'>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} />
          <XAxis
            dataKey='label'
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length || !label) return null
              const value = payload[0]?.value ?? 0
              return (
                <div className='rounded-lg border border-border bg-card px-3 py-2 shadow-md'>
                  <p className='text-xs font-medium text-muted-foreground'>{label}</p>
                  <p className='text-sm font-semibold'>
                    {seriesLabel}: {value}
                  </p>
                  {onBarClick && (
                    <p className='text-xs text-muted-foreground mt-1'>Click bar to view entities</p>
                  )}
                </div>
              )
            }}
            cursor={onBarClick ? { fill: 'hsl(var(--muted))', opacity: 0.3 } : false}
          />
          <Bar
            dataKey='count'
            fill='var(--color-count)'
            radius={[4, 4, 0, 0]}
            name={seriesLabel}
            onClick={handleBarClick}
            style={onBarClick ? { cursor: 'pointer' } : undefined}
          />
        </BarChart>
      </ChartContainer>
    </AppCard>
  )
}
