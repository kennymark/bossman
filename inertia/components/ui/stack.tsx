import * as React from 'react'
import { cn } from '@/lib/utils'

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: number | string
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, spacing = 4, align = 'stretch', justify = 'start', children, ...props }, ref) => {
    const spacingValue = typeof spacing === 'number' ? `${spacing * 0.25}rem` : spacing

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col',
          {
            'items-start': align === 'start',
            'items-center': align === 'center',
            'items-end': align === 'end',
            'items-stretch': align === 'stretch',
            'justify-start': justify === 'start',
            'justify-center': justify === 'center',
            'justify-end': justify === 'end',
            'justify-between': justify === 'between',
            'justify-around': justify === 'around',
            'justify-evenly': justify === 'evenly',
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

Stack.displayName = 'Stack'
