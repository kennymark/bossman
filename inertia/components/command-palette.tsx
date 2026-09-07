'use client'

import type { SharedProps } from '@adonisjs/inertia/types'
import { router, usePage } from '@inertiajs/react'
import {
  IconBell,
  IconBriefcase,
  IconBuilding,
  IconChartBar,
  IconCheck,
  IconDatabase,
  IconFileText,
  IconFolder,
  IconLayoutDashboard,
  IconLogout,
  IconLogs,
  IconMail,
  IconMoon,
  IconNews,
  IconPackage,
  IconServer,
  IconSettings,
  IconSquarePlus,
  IconStack,
  IconSun,
  IconTerminal2,
  IconTool,
  IconUsers,
} from '@tabler/icons-react'
import * as React from 'react'

import type { PageKey } from '#utils/page_access'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { usePageCommands } from '@/contexts/page-commands'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

type CommandEntry = {
  label: string
  href: string
  icon?: React.ReactNode
  keywords?: string
  requires?: PageKey
}

const OPEN_EVENT = 'command-palette:open'

/**
 * Opens the palette from anywhere — a keyboard hint, a toast action. The palette
 * listens for the event while mounted, so callers need no reference to it.
 */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return target.isContentEditable
}

function useCommandShortcutLabel() {
  const [label, setLabel] = React.useState('⌘K')

  React.useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    setLabel(isMac ? '⌘K' : 'Ctrl K')
  }, [])

  return label
}

/** Header control that opens the command palette with a mouse click. */
export function CommandPaletteTrigger({ className }: { className?: string }) {
  const shortcut = useCommandShortcutLabel()

  return (
    <button
      type='button'
      onClick={() => openCommandPalette()}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      aria-label='Open command palette'
      aria-keyshortcuts='Meta+K Control+K'>
      <IconTerminal2 className='h-4 w-4 shrink-0' />
      <span className='hidden sm:inline'>Commands</span>
      <kbd className='pointer-events-none hidden h-5 select-none items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex'>
        {shortcut}
      </kbd>
    </button>
  )
}

/**
 * Cmd+K command palette for navigation, theme, account, and page-contextual actions.
 * Record search lives in the header `GlobalSearch` field (⌘/), not here.
 */
export function CommandPalette() {
  const page = usePage<SharedProps>()
  const isLoggedIn = Boolean(page.props.isLoggedIn)
  const { theme, setTheme } = useTheme()
  const pageAccess = (page.props as SharedProps & { pageAccess?: PageKey[] | null }).pageAccess
  const pageCommands = usePageCommands()

  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const isCmdK = (e.metaKey || e.ctrlKey) && key === 'k'
      if (!isCmdK) return

      // Avoid stealing focus while the user is typing into form fields
      if (isEditableTarget(e.target)) return

      e.preventDefault()
      setOpen((v) => !v)
    }
    const onOpen = () => setOpen(true)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [])

  const run = React.useCallback((action: () => void) => {
    setOpen(false)
    /**
     * Close the dialog before running the action so sheets/dialogs opened by
     * page commands are not fighting the palette for focus.
     */
    queueMicrotask(action)
  }, [])

  const go = React.useCallback(
    (href: string) => {
      run(() => router.visit(href))
    },
    [run],
  )

  const selectTheme = React.useCallback(
    (next: 'light' | 'dark' | 'system') => {
      run(() => setTheme(next))
    },
    [run, setTheme],
  )

  if (!isLoggedIn) return null

  const appNav: CommandEntry[] = [
    {
      label: 'Analytics',
      href: '/analytics',
      icon: <IconChartBar className='mr-2 h-4 w-4' />,
      requires: 'analytics',
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <IconLayoutDashboard className='mr-2 h-4 w-4' />,
      requires: 'dashboard',
    },
    {
      label: 'Leases',
      href: '/leases',
      icon: <IconFileText className='mr-2 h-4 w-4' />,
      requires: 'leases',
    },
    {
      label: 'Properties',
      href: '/properties',
      icon: <IconStack className='mr-2 h-4 w-4' />,
      requires: 'properties',
    },
    {
      label: 'Customers',
      href: '/orgs',
      icon: <IconBuilding className='mr-2 h-4 w-4' />,
      keywords: 'orgs organisations',
      requires: 'orgs',
    },
    {
      label: 'Maintenance',
      href: '/maintenance',
      icon: <IconTool className='mr-2 h-4 w-4' />,
      keywords: 'requests repairs',
      requires: 'maintenance',
    },
    {
      label: 'Documents',
      href: '/documents',
      icon: <IconFolder className='mr-2 h-4 w-4' />,
      keywords: 'files',
      requires: 'documents',
    },
    {
      label: 'Jobs',
      href: '/jobs',
      icon: <IconBriefcase className='mr-2 h-4 w-4' />,
      keywords: 'queue workers pg-boss',
      requires: 'jobs',
    },
    {
      label: 'Push notifications',
      href: '/push-notifications',
      icon: <IconBell className='mr-2 h-4 w-4' />,
      requires: 'pushNotifications',
    },
    {
      label: 'Teams',
      href: '/teams',
      icon: <IconUsers className='mr-2 h-4 w-4' />,
      requires: 'teams',
    },
    {
      label: 'Backups',
      href: '/db-backups',
      icon: <IconDatabase className='mr-2 h-4 w-4' />,
      requires: 'dbBackups',
    },
    {
      label: 'Servers',
      href: '/servers',
      icon: <IconServer className='mr-2 h-4 w-4' />,
      requires: 'servers',
    },
    {
      label: 'Logs',
      href: '/logs',
      icon: <IconLogs className='mr-2 h-4 w-4' />,
      requires: 'logs',
    },
    {
      label: 'Emails',
      href: '/emails',
      icon: <IconMail className='mr-2 h-4 w-4' />,
      requires: 'emails',
    },
    {
      label: 'Blog',
      href: '/blog/manage',
      icon: <IconNews className='mr-2 h-4 w-4' />,
      requires: 'blog',
    },
    {
      label: 'New blog post',
      href: '/blog/manage/create',
      icon: <IconSquarePlus className='mr-2 h-4 w-4' />,
      requires: 'blog',
    },
    {
      label: 'Blog categories',
      href: '/blog/manage/categories',
      icon: <IconNews className='mr-2 h-4 w-4' />,
      requires: 'blog',
    },
    {
      label: 'Addons',
      href: '/addons',
      icon: <IconPackage className='mr-2 h-4 w-4' />,
      requires: 'addons',
    },
    { label: 'Settings', href: '/settings', icon: <IconSettings className='mr-2 h-4 w-4' /> },
  ]

  const accountActions: CommandEntry[] = [
    { label: 'Log out', href: '/logout', icon: <IconLogout className='mr-2 h-4 w-4' /> },
  ]

  const visibleAppNav = (() => {
    if (!pageAccess) return appNav
    return appNav.filter((i) => !i.requires || pageAccess.includes(i.requires))
  })()

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command…' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {pageCommands.length > 0 ? (
          <>
            <CommandGroup heading='This page'>
              {pageCommands.map((item) => (
                <CommandItem
                  key={item.id}
                  className='cursor-pointer py-2'
                  value={`${item.label} ${item.keywords || ''} ${item.description || ''}`}
                  onSelect={() => run(() => item.onSelect())}>
                  {item.icon}
                  <div className='flex min-w-0 flex-col'>
                    <span>{item.label}</span>
                    {item.description ? (
                      <span className='truncate text-xs text-muted-foreground'>
                        {item.description}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        <CommandGroup heading='App'>
          {visibleAppNav.map((item) => (
            <CommandItem
              key={item.href}
              className='cursor-pointer py-2'
              value={`${item.label} ${item.keywords || ''}`}
              onSelect={() => go(item.href)}>
              {item.icon}
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading='Theme'>
          <CommandItem
            className='cursor-pointer'
            value='Theme: Light'
            onSelect={() => selectTheme('light')}>
            <IconSun className='mr-2 h-4 w-4' />
            Light
            {theme === 'light' ? <IconCheck className='ml-auto h-4 w-4' /> : null}
          </CommandItem>
          <CommandItem
            className='cursor-pointer'
            value='Theme: Dark'
            onSelect={() => selectTheme('dark')}>
            <IconMoon className='mr-2 h-4 w-4' />
            Dark
            {theme === 'dark' ? <IconCheck className='ml-auto h-4 w-4' /> : null}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading='Account'>
          {accountActions.map((item) => (
            <CommandItem
              key={item.href}
              className='cursor-pointer'
              value={`${item.label} ${item.keywords || ''}`}
              onSelect={() => go(item.href)}>
              {item.icon}
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
