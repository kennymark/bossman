import { format, isAfter, isBefore, isValid, parse, startOfDay } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  id?: string
  value?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  minDate?: Date
  maxDate?: Date
  buttonClassName?: string
  buttonSize?: React.ComponentProps<typeof Button>['size']
}

function parseDateValue(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  return isValid(parsed) ? parsed : undefined
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  clearable,
  minDate,
  maxDate,
  buttonClassName,
  buttonSize = 'default',
}: DatePickerProps) {
  const selected = parseDateValue(value ?? null)
  const min = minDate ? startOfDay(minDate) : null
  const max = maxDate ? startOfDay(maxDate) : null

  return (
    <div className='relative'>
      <Popover>
        <PopoverTrigger >
          <Button
            id={id}
            type='button'
            variant='outline'
            size={buttonSize}
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !selected && 'text-muted-foreground',
              buttonClassName,
            )}
            leftIcon={<CalendarIcon className='h-4 w-4' />}>
            {selected ? format(selected, 'PPP') : placeholder}
          </Button>
        </PopoverTrigger>

        {clearable && value ? (
          <button
            type='button'
            aria-label='Clear date'
            className='absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange?.('')
            }}>
            <X className='h-4 w-4' />
          </button>
        ) : null}

        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={selected}
            onSelect={(date) => {
              if (!date) {
                onChange?.('')
                return
              }
              onChange?.(format(date, 'yyyy-MM-dd'))
            }}
            disabled={(date) => {
              const d = startOfDay(date)
              if (min && isBefore(d, min)) return true
              if (max && isAfter(d, max)) return true
              return false
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
