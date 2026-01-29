import { ChevronLeft, ChevronRight } from 'lucide-react'
import type * as React from 'react'
import { type ChevronProps, DayPicker } from 'react-day-picker'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  navLayout = 'around',
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout={navLayout}
      className={cn(className)}
      classNames={{
        root: 'p-3',
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        // Make the month container positionable for nav buttons
        month: 'relative space-y-4 pt-1',
        // Center month/year label, leaving space for left/right arrows
        month_caption: 'flex items-center justify-center px-10 pt-1',
        caption_label: 'text-sm font-medium',
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          // In navLayout="around", the prev button is rendered as a sibling of the caption.
          // Pin it to the left side of the month header.
          'absolute left-0 top-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          // Pin next button to the right side of the month header.
          'absolute right-0 top-0 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        weeks: 'flex flex-col w-full',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:text-accent-foreground first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100 aria-selected:bg-primary aria-selected:text-primary-foreground',
        ),
        selected: 'bg-primary text-primary-foreground',
        today: 'bg-gray-400 text-accent-foreground ',
        outside:
          'text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ className: iconClassName, orientation }: ChevronProps) => {
          if (orientation === 'left') {
            return <ChevronLeft className={cn('h-4 w-4', iconClassName)} />
          }
          if (orientation === 'right') {
            return <ChevronRight className={cn('h-4 w-4', iconClassName)} />
          }
          return <ChevronRight className={cn('h-4 w-4 opacity-0', iconClassName)} />
        },
      }}
      {...props}
    />
  )
}
