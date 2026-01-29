import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import useDisclosure from '@/hooks/use-disclosure'
import { cn } from '@/lib/utils'

interface ComboboxOption {
  value: string
  label: string
  [key: string]: unknown
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  allowClear?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  className,
  disabled = false,
  allowClear = true,
}: ComboboxProps) {
  const { isOpen, close, onOpenChange } = useDisclosure()
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      if (selectedValue === '' || selectedValue === 'clear') {
        // Clear selection
        onValueChange?.(undefined)
      } else {
        // Toggle selection - if already selected, deselect
        const newValue = selectedValue === value ? undefined : selectedValue
        onValueChange?.(newValue)
      }
      close()
    },
    [value, onValueChange, close],
  )

  // Filter options based on search input
  const [search, setSearch] = React.useState('')
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((option) => option.label.toLowerCase().includes(searchLower))
  }, [options, search])

  // If we're inside a Sheet/Dialog, portal the popover into it so clicks work.
  const portalContainer = triggerRef.current?.closest('[role="dialog"]') ?? null

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant='outline'
          role='combobox'
          aria-expanded={isOpen}
          className={cn('w-full justify-between', className)}
          disabled={disabled}>
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='p-0' align='start' sideOffset={4} >
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allowClear && value && (
                <CommandItem
                  value='clear selection'
                  onSelect={() => handleSelect('clear')}
                  onMouseDown={(e) => {
                    // Ensure mouse selection works even when cmdk's onSelect
                    // isn't fired due to focus/pointer quirks in dialogs/sheets.
                    e.preventDefault()
                    handleSelect('clear')
                  }}
                  className='cursor-pointer text-muted-foreground'>
                  <div className='mr-2 h-4 w-4' />
                  Clear selection
                </CommandItem>
              )}
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => handleSelect(option.value)}
                  onMouseDown={(e) => {
                    // Force mouse selection to register reliably.
                    e.preventDefault()
                    handleSelect(option.value)
                  }}
                  className='cursor-pointer'>
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
