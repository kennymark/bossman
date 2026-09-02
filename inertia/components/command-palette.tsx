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
  IconUser,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react'
import * as React from 'react'

import type { PageKey } from '#utils/page_access'
import {
  MIN_QUERY_LENGTH,
  SEARCH_GROUP_LABELS,
  type SearchGroup,
  type SearchResponse,
  type SearchResult,
} from '#utils/search'
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
import api from '@/lib/http'

type CommandEntry = {
  label: string
  href: string
  icon?: React.ReactNode
  keywords?: string
  requires?: PageKey
}

const OPEN_EVENT = 'command-palette:open'
const SEARCH_DEBOUNCE_MS = 250

/**
 * Opens the palette from anywhere — the header search button, a keyboard hint, a
 * toast action. The palette listens for the event while mounted, so callers need no
 * reference to it.
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

const GROUP_ICONS: Record<SearchGroup, React.ReactNode> = {
  orgs: <IconBuilding className='mr-2 h-4 w-4 shrink-0' />,
  users: <IconUser className='mr-2 h-4 w-4 shrink-0' />,
  tenants: <IconUsersGroup className='mr-2 h-4 w-4 shrink-0' />,
  leases: <IconFileText className='mr-2 h-4 w-4 shrink-0' />,
  properties: <IconStack className='mr-2 h-4 w-4 shrink-0' />,
  maintenance: <IconTool className='mr-2 h-4 w-4 shrink-0' />,
}

type SearchStatus = 'idle' | 'loading' | 'done' | 'error'

/**
 * Debounced record search. Results are keyed to the query that produced them, so a
 * slow response for an earlier query can never overwrite a newer one.
 */
function useRecordSearch(query: string, enabled: boolean) {
  const [status, setStatus] = React.useState<SearchStatus>('idle')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const latest = React.useRef(0)

  React.useEffect(() => {
    const q = query.trim()
    if (!enabled || q.length < MIN_QUERY_LENGTH) {
      latest.current += 1
      setStatus('idle')
      setResults([])
      return
    }

    const requestId = ++latest.current
    setStatus('loading')

    const timer = window.setTimeout(async () => {
      try {
        const res = (await api.search.index({
          query: { q } as never,
        })) as unknown as SearchResponse
        if (requestId !== latest.current) return
        setResults(Array.isArray(res?.results) ? res.results : [])
        setStatus('done')
      } catch {
        if (requestId !== latest.current) return
        setResults([])
        setStatus('error')
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [query, enabled])

  return { status, results }
}

export function CommandPalette() {
  const page = usePage<SharedProps>()
  const isLoggedIn = Boolean(page.props.isLoggedIn)
  const { theme, setTheme } = useTheme()
  const pageAccess = (page.props as SharedProps & { pageAccess?: PageKey[] | null }).pageAccess

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const searching = query.trim().length >= MIN_QUERY_LENGTH
  const { status, results } = useRecordSearch(query, open && isLoggedIn)

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

  /** A reopened palette starts clean rather than on the last search. */
  React.useEffect(() => {
    if (!open) setQuery('')
  }, [open])

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

  // CmdK is only mounted in dashboard layouts, but keep a guard anyway.
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

  const showResults = searching && results.length > 0
  const resultsMessage = (() => {
    if (!searching) return null
    if (status === 'loading') return 'Searching…'
    if (status === 'error') return 'Search is unavailable right now.'
    if (status === 'done' && results.length === 0) return 'No records'
    return null
  })()

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder='Search records or type a command…'
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/*
         * cmdk's own empty state counts only items that pass its filter, which the
         * force-mounted results never do. While searching the message below stands in
         * for it.
         */}
        {!searching && <CommandEmpty>No results found.</CommandEmpty>}

        {resultsMessage && (
          <div className='px-3 py-3 text-xs text-muted-foreground' aria-live='polite'>
            {resultsMessage}
          </div>
        )}

        {showResults && (
          <>
            {/*
             * Results are fetched for the typed query, so cmdk must not filter them
             * again: `forceMount` keeps every row rendered and keyboard-selectable.
             */}
            <CommandGroup heading='Results' forceMount>
              {results.map((item) => (
                <CommandItem
                  key={`${item.group}:${item.id}`}
                  forceMount
                  className='cursor-pointer py-2'
                  value={`result:${item.group}:${item.id}`}
                  onSelect={() => go(item.href)}>
                  {GROUP_ICONS[item.group]}
                  <div className='flex min-w-0 flex-1 flex-col'>
                    <span className='truncate'>{item.title}</span>
                    {item.subtitle && (
                      <span className='truncate text-xs text-muted-foreground'>
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  <span className='ml-2 shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground'>
                    {item.badge
                      ? `${SEARCH_GROUP_LABELS[item.group]} · ${item.badge}`
                      : SEARCH_GROUP_LABELS[item.group]}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

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
