import { Check } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface RadioGroupOption {
  /** Value used for selection and onChange (e.g. 'landlord', 'agency') */
  value: string
  label: string
  /** Optional description shown under the label */
  description?: string
}

export interface RadioGroupProps {
  /** Gap between options (e.g. 2 = gap-2) */
  spacing?: number
  /** Options to render (selection is by option.value) */
  options: RadioGroupOption[]
  /** Layout direction */
  orientation?: 'horizontal' | 'vertical'
  /** Selected option's value */
  value: string
  /** Called when selection changes (receives the selected option's value) */
  onChange?: (value: string) => void
  /** Optional name for the underlying radio inputs */
  name?: string
  /** Disable all options */
  disabled?: boolean
  className?: string
}

const spacingToClass: Record<number, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      spacing = 2,
      options,
      orientation = 'vertical',
      value,
      onChange,
      name: nameProp,
      disabled = false,
      className,
    },
    ref,
  ) => {
    const name = nameProp ?? React.useId()
    const gapClass = spacingToClass[spacing] ?? `gap-${spacing}`

    return (
      <div
        ref={ref}
        role='radiogroup'
        aria-orientation={orientation}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col',
          gapClass,
          className,
        )}
      >
        {options.map((option) => {
          const isSelected = value === option.value
          const optionId = `${name}-${option.value}`

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-colors',
                'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-muted-foreground/50',
                disabled && 'pointer-events-none opacity-50',
              )}
            >
              <input
                type='radio'
                id={optionId}
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange?.(option.value)}
                disabled={disabled}
                className='sr-only'
                aria-checked={isSelected}
              />
              <div className='flex items-start gap-3'>
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                  )}
                >
                  {isSelected && <Check className='h-3 w-3' />}
                </span>
                <div className='min-w-0'>
                  <span className='font-medium'>{option.label}</span>
                  {option.description ? (
                    <p className='text-sm text-muted-foreground mt-0.5'>{option.description}</p>
                  ) : null}
                </div>
              </div>
            </label>
          )
        })}
      </div>
    )
  },
)

RadioGroup.displayName = 'RadioGroup'
