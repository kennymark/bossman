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
import { useTheme } from '@/hooks/use-theme'

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

/**
 * Cmd+K command palette for navigation, theme, and account actions.
 * Record search lives in the header `GlobalSearch` field (⌘/), not here.
 */
export function CommandPalette() {
  const page = usePage<SharedProps>()
  const isLoggedIn = Boolean(page.props.isLoggedIn)
  const { theme, setTheme } = useTheme()
  const pageAccess = (page.props as SharedProps & { pageAccess?: PageKey[] | null }).pageAccess

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

  const go = React.useCallback((href: string) => {
    setOpen(false)
    router.visit(href)
  }, [])

  const selectTheme = React.useCallback(
    (next: 'light' | 'dark' | 'system') => {
      setOpen(false)
      setTheme(next)
    },
    [setTheme],
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
          <CommandItem value='Theme: Light' onSelect={() => selectTheme('light')}>
            <IconSun className='mr-2 h-4 w-4' />
            Light
            {theme === 'light' ? <IconCheck className='ml-auto h-4 w-4' /> : null}
          </CommandItem>
          <CommandItem value='Theme: Dark' onSelect={() => selectTheme('dark')}>
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
