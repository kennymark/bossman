import { Check } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(checked ?? false)

    const isChecked = checked !== undefined ? checked : internalChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      if (checked === undefined) {
        setInternalChecked(newChecked)
      }
      onCheckedChange?.(newChecked)
    }

    return (
      <label className='relative inline-flex items-center cursor-pointer'>
        <input
          type='checkbox'
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className='sr-only peer'
          {...props}
        />
        <div
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            isChecked && 'bg-primary text-primary-foreground',
            className,
          )}>
          {isChecked && (
            <div className='flex items-center justify-center text-current'>
              <Check className='h-4 w-4' />
            </div>
          )}
        </div>
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
