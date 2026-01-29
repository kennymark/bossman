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
