'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <CardDescription>Last 10 weeks</CardDescription>
      </CardHeader>
      <CardContent>
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
            <Bar
              dataKey='count'
              fill='var(--color-count)'
              radius={[4, 4, 0, 0]}
              name={seriesLabel}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function GrowthChart({ title, data, config }: GrowthChartProps) {
  const chartData = useMemo(() => buildChartData(data), [data])
  const seriesLabel = config.count?.label ?? 'Count'

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
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
            <Bar
              dataKey='count'
              fill='var(--color-count)'
              radius={[4, 4, 0, 0]}
              name={seriesLabel}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
