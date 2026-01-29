'use client'

import type { ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export type ChartConfig = Record<
  string,
  {
    label?: string
    color?: string
    icon?: React.ComponentType<{ className?: string }>
  }
>

type ChartContainerProps = {
  config: ChartConfig
  children: ReactNode
  className?: string
}

export function ChartContainer({ config, children, className }: ChartContainerProps) {
  const style = {} as Record<string, string>
  for (const key of Object.keys(config)) {
    const value = config[key]
    if (value?.color) {
      style[`--color-${key}` as string] = value.color
    }
  }

  return (
    <div
      className={cn('h-[200px] w-full', className)}
      style={style as React.CSSProperties}>
      <ResponsiveContainer width='100%' height='100%'>
        {children}
      </ResponsiveContainer>
    </div>
  )
}
