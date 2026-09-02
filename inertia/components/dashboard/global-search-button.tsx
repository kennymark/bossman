import { IconSearch } from '@tabler/icons-react'
import * as React from 'react'

import { openCommandPalette } from '@/components/command-palette'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** The modifier the palette shortcut actually uses on this machine. */
function useShortcutLabel() {
  const [label, setLabel] = React.useState('⌘K')

  React.useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    setLabel(isMac ? '⌘K' : 'Ctrl K')
  }, [])

  return label
}

/**
 * Header entry point for the command palette. Mount it next to the notification
 * bell; the palette itself must be rendered in the same layout for the event to land.
 */
export function GlobalSearchButton({ className }: { className?: string }) {
  const shortcut = useShortcutLabel()

  return (
    <Button
      type='button'
      variant='outline'
      onClick={openCommandPalette}
      aria-label='Search records'
      aria-keyshortcuts='Meta+K Control+K'
      className={cn('h-9 justify-start gap-2 text-muted-foreground sm:w-56 sm:pr-1.5', className)}>
      <IconSearch className='h-4 w-4' />
      <span className='hidden flex-1 text-left text-sm sm:inline'>Search…</span>
      <kbd className='hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline'>
        {shortcut}
      </kbd>
    </Button>
  )
}
