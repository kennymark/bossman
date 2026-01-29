import * as React from 'react'
import { cn } from '@/lib/utils'

export interface HStackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: number | string
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
}

export const HStack = React.forwardRef<HTMLDivElement, HStackProps>(
  (
    { className, spacing = 4, align = 'center', justify = 'start', wrap = false, children, ...props },
    ref,
  ) => {
    const spacingValue = typeof spacing === 'number' ? `${spacing * 0.25}rem` : spacing

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-row',
          {
            'items-start': align === 'start',
            'items-center': align === 'center',
            'items-end': align === 'end',
            'items-stretch': align === 'stretch',
            'items-baseline': align === 'baseline',
            'justify-start': justify === 'start',
            'justify-center': justify === 'center',
            'justify-end': justify === 'end',
            'justify-between': justify === 'between',
            'justify-around': justify === 'around',
            'justify-evenly': justify === 'evenly',
            'flex-wrap': wrap,
          },
          className,
        )}
        style={{ gap: spacingValue, ...props.style }}
        {...props}>
        {children}
      </div>
    )
  },
)

HStack.displayName = 'HStack'
