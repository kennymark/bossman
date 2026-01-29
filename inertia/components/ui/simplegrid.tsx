import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SimpleGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number | { base?: number; sm?: number; md?: number; lg?: number; xl?: number }
  spacing?: number | string
  minChildWidth?: string
}

const gridColsMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
}

const getGridColsClass = (cols: number | { base?: number; sm?: number; md?: number; lg?: number; xl?: number }): string => {
  if (typeof cols === 'number') {
    return gridColsMap[cols] || ''
  }

  const classes: string[] = []
  if (cols.base) classes.push(gridColsMap[cols.base] || '')
  if (cols.sm) classes.push(`sm:${gridColsMap[cols.sm] || ''}`)
  if (cols.md) classes.push(`md:${gridColsMap[cols.md] || ''}`)
  if (cols.lg) classes.push(`lg:${gridColsMap[cols.lg] || ''}`)
  if (cols.xl) classes.push(`xl:${gridColsMap[cols.xl] || ''}`)

  return classes.filter(Boolean).join(' ')
}

export const SimpleGrid = React.forwardRef<HTMLDivElement, SimpleGridProps>(
  ({ className, cols = 1, spacing = 4, minChildWidth, children, ...props }, ref) => {
    const spacingValue = typeof spacing === 'number' ? `${spacing * 0.25}rem` : spacing

    const gridColsClass = React.useMemo(() => getGridColsClass(cols), [cols])

    const style = React.useMemo(() => {
      const baseStyle: React.CSSProperties = { gap: spacingValue, ...props.style }
      
      if (minChildWidth) {
        baseStyle.gridTemplateColumns = `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`
      } else if (typeof cols === 'number' && !gridColsMap[cols]) {
        // Use inline style for custom column counts not in the map
        baseStyle.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`
      } else if (typeof cols === 'object') {
        // For responsive cols, use CSS variables or inline styles
        const baseCols = cols.base || 1
        if (!gridColsMap[baseCols]) {
          baseStyle.gridTemplateColumns = `repeat(${baseCols}, minmax(0, 1fr))`
        }
      }
      
      return baseStyle
    }, [spacingValue, minChildWidth, cols, gridColsClass, props.style])

    return (
      <div
        ref={ref}
        className={cn('grid', gridColsClass || 'grid-cols-1', className)}
        style={style}
        {...props}>
        {children}
      </div>
    )
  },
)

SimpleGrid.displayName = 'SimpleGrid'
