import { format, isAfter, isBefore, isValid, parse, startOfDay } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DateTimePickerProps {
  id?: string
  value?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  /**
   * Format must match the old `<input type="datetime-local" />` value: `yyyy-MM-dd'T'HH:mm`
   */
  minDateTime?: string
  maxDateTime?: string
  buttonClassName?: string
  buttonSize?: React.ComponentProps<typeof Button>['size']
}

const DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm"

function parseDateTimeValue(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const parsed = parse(value, DATE_TIME_FORMAT, new Date())
  return isValid(parsed) ? parsed : undefined
}

function formatDateTimeValue(date: Date): string {
  return format(date, DATE_TIME_FORMAT)
}

function clampDateTime(value: string, minDateTime?: string, maxDateTime?: string): string {
  const dt = parseDateTimeValue(value)
  if (!dt) return value

  const min = parseDateTimeValue(minDateTime)
  if (min && isBefore(dt, min)) return formatDateTimeValue(min)

  const max = parseDateTimeValue(maxDateTime)
  if (max && isAfter(dt, max)) return formatDateTimeValue(max)

  return value
}

export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date & time',
  disabled,
  clearable,
  minDateTime,
  maxDateTime,
  buttonClassName,
  buttonSize = 'default',
}: DateTimePickerProps) {
  const selected = parseDateTimeValue(value ?? null)
  const min = parseDateTimeValue(minDateTime)
  const max = parseDateTimeValue(maxDateTime)

  const selectedTime = selected ? format(selected, 'HH:mm') : ''

  return (
    <div className='relative'>
      <Popover>
        <PopoverTrigger asChild>
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
            {selected ? format(selected, 'PPP p') : placeholder}
          </Button>
        </PopoverTrigger>

        {clearable && value ? (
          <button
            type='button'
            aria-label='Clear date and time'
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
          <div className='p-3'>
            <Calendar
              mode='single'
              selected={selected}
              onSelect={(date) => {
                if (!date) {
                  onChange?.('')
                  return
                }

                const base = selected ?? new Date()
                const next = new Date(date)
                next.setHours(base.getHours(), base.getMinutes(), 0, 0)

                const nextValue = clampDateTime(formatDateTimeValue(next), minDateTime, maxDateTime)
                onChange?.(nextValue)
              }}
              disabled={(date) => {
                const d = startOfDay(date)
                if (min && isBefore(d, startOfDay(min))) return true
                if (max && isAfter(d, startOfDay(max))) return true
                return false
              }}
              initialFocus
            />

            <div className='pt-3 border-t space-y-2'>
              <Label
                className='text-xs text-muted-foreground'
                htmlFor={id ? `${id}-time` : undefined}>
                Time
              </Label>
              <Input
                id={id ? `${id}-time` : undefined}
                type='time'
                value={selectedTime}
                onChange={(e) => {
                  const time = e.target.value
                  if (!time) return

                  const base = selected ?? new Date()
                  const [hh, mm] = time.split(':').map((v) => Number(v))
                  const next = new Date(base)
                  next.setHours(hh || 0, mm || 0, 0, 0)

                  const nextValue = clampDateTime(
                    formatDateTimeValue(next),
                    minDateTime,
                    maxDateTime,
                  )
                  onChange?.(nextValue)
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
