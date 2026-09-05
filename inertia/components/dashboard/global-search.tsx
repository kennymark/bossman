'use client'

import { router } from '@inertiajs/react'
import {
  IconBuilding,
  IconFileText,
  IconSearch,
  IconStack,
  IconTool,
  IconUser,
  IconUsersGroup,
  IconX,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'

import {
  MIN_QUERY_LENGTH,
  SEARCH_GROUP_LABELS,
  SEARCH_GROUPS,
  type SearchGroup,
  type SearchResponse,
  type SearchResult,
} from '#utils/search'
import { useDebounce } from '@/hooks/use-debounce'
import api from '@/lib/http'
import { cn } from '@/lib/utils'

const SEARCH_DEBOUNCE_MS = 300

type Category = 'all' | SearchGroup

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <IconSearch className='h-3.5 w-3.5' /> },
  { id: 'orgs', label: 'Customers', icon: <IconBuilding className='h-3.5 w-3.5' /> },
  { id: 'users', label: 'Users', icon: <IconUser className='h-3.5 w-3.5' /> },
  { id: 'tenants', label: 'Tenants', icon: <IconUsersGroup className='h-3.5 w-3.5' /> },
  { id: 'leases', label: 'Leases', icon: <IconFileText className='h-3.5 w-3.5' /> },
  { id: 'properties', label: 'Properties', icon: <IconStack className='h-3.5 w-3.5' /> },
  { id: 'maintenance', label: 'Maintenance', icon: <IconTool className='h-3.5 w-3.5' /> },
]

const GROUP_ICONS: Record<SearchGroup, React.ReactNode> = {
  orgs: <IconBuilding className='h-4 w-4 shrink-0 text-muted-foreground' />,
  users: <IconUser className='h-4 w-4 shrink-0 text-muted-foreground' />,
  tenants: <IconUsersGroup className='h-4 w-4 shrink-0 text-muted-foreground' />,
  leases: <IconFileText className='h-4 w-4 shrink-0 text-muted-foreground' />,
  properties: <IconStack className='h-4 w-4 shrink-0 text-muted-foreground' />,
  maintenance: <IconTool className='h-4 w-4 shrink-0 text-muted-foreground' />,
}

function useShortcutLabel() {
  const [label, setLabel] = React.useState('⌘/')

  React.useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    setLabel(isMac ? '⌘/' : 'Ctrl /')
  }, [])

  return label
}

function useIsNarrow() {
  const [narrow, setNarrow] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const sync = () => setNarrow(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return narrow
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return target.isContentEditable
}

function groupResults(results: SearchResult[]) {
  const byGroup = new Map<SearchGroup, SearchResult[]>()
  for (const group of SEARCH_GROUPS) byGroup.set(group, [])
  for (const result of results) {
    byGroup.get(result.group)?.push(result)
  }
  return SEARCH_GROUPS.map((group) => ({
    group,
    items: byGroup.get(group) ?? [],
  })).filter((entry) => entry.items.length > 0)
}

/**
 * Header record search — type in the field (or press ⌘/) to query. Cmd+K stays on
 * the command palette for navigation and account actions.
 */
export function GlobalSearch({ className }: { className?: string }) {
  const shortcut = useShortcutLabel()
  const isNarrow = useIsNarrow()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [term, setTerm] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  const [category, setCategory] = React.useState<Category>('all')
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const debouncedTerm = useDebounce(term, SEARCH_DEBOUNCE_MS)
  const query = debouncedTerm.trim()
  const canSearch = query.length >= MIN_QUERY_LENGTH

  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ['global-search', query, category],
    enabled: canSearch && isOpen,
    queryFn: async () => {
      const res = (await api.search.index({
        query: {
          q: query,
          ...(category === 'all' ? {} : { groups: category }),
        } as never,
      })) as unknown as SearchResponse
      return Array.isArray(res?.results) ? res.results : []
    },
  })

  const grouped = React.useMemo(() => groupResults(results), [results])
  const flatItems = React.useMemo(() => grouped.flatMap((entry) => entry.items), [grouped])
  const totalResults = flatItems.length

  const focusInput = React.useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  React.useEffect(() => {
    if (isOpen) focusInput()
  }, [isOpen, focusInput])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query, category, results])

  React.useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      const isSearchShortcut = (event.metaKey || event.ctrlKey) && key === '/'
      if (!isSearchShortcut) return
      if (isEditableTarget(event.target) && event.target !== inputRef.current) return

      event.preventDefault()
      setIsOpen((open) => {
        const next = !open
        if (next) focusInput()
        else {
          inputRef.current?.blur()
          setTerm('')
        }
        return next
      })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusInput])

  function close() {
    setIsOpen(false)
    setTerm('')
    inputRef.current?.blur()
  }

  function openResult(href: string) {
    close()
    router.visit(href)
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (!isOpen) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((index) => Math.min(index + 1, Math.max(totalResults - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && flatItems[selectedIndex]) {
      event.preventDefault()
      openResult(flatItems[selectedIndex].href)
    }
  }

  const scopeLabel =
    category === 'all'
      ? 'all records'
      : (CATEGORIES.find((entry) => entry.id === category)?.label.toLowerCase() ?? 'records')

  let runningIndex = -1

  const searchInput = (
    <input
      ref={inputRef}
      value={term}
      onChange={(event) => setTerm(event.target.value)}
      onFocus={() => setIsOpen(true)}
      onKeyDown={onInputKeyDown}
      placeholder='Search records…'
      aria-label='Search records'
      aria-keyshortcuts='Meta+/ Control+/'
      aria-expanded={isOpen}
      aria-controls='global-search-results'
      className={cn(
        'h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground',
        !isNarrow &&
          'rounded-lg border border-input bg-secondary py-2 pr-16 pl-8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-popover',
      )}
    />
  )

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {isNarrow ? (
        <button
          type='button'
          className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-secondary text-muted-foreground hover:bg-secondary/80'
          aria-label='Search records'
          onClick={() => {
            setIsOpen(true)
            focusInput()
          }}>
          <IconSearch className='h-4 w-4' />
        </button>
      ) : (
        <div
          className={cn(
            'relative flex h-9 w-56 items-center transition-[width] duration-150',
            isOpen && 'w-72',
          )}>
          <IconSearch className='pointer-events-none absolute left-2.5 h-4 w-4 text-muted-foreground' />
          {searchInput}
          <kbd className='pointer-events-none absolute right-2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground'>
            {shortcut}
          </kbd>
        </div>
      )}

      {isOpen && (
        <div
          id='global-search-results'
          role='listbox'
          className='absolute top-11 right-0 z-50 flex w-[min(100vw-2rem,36rem)] flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg'>
          {isNarrow && (
            <div className='flex items-center gap-2 border-b border-border px-3 py-2'>
              <IconSearch className='h-4 w-4 shrink-0 text-muted-foreground' />
              <div className='min-w-0 flex-1'>{searchInput}</div>
              <button
                type='button'
                onClick={close}
                aria-label='Close search'
                className='inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent'>
                <IconX className='h-4 w-4' />
              </button>
            </div>
          )}

          <div className='border-b border-border px-3 py-2'>
            <p className='text-xs text-muted-foreground' aria-live='polite'>
              {isFetching
                ? 'Searching…'
                : isError
                  ? 'Search is unavailable right now.'
                  : `${totalResults} result${totalResults === 1 ? '' : 's'}${
                      term.trim() ? ` for “${term.trim()}”` : ''
                    } across ${scopeLabel}`}
            </p>
            <div className='mt-2 flex gap-1 overflow-x-auto pb-0.5'>
              {CATEGORIES.map((entry) => {
                const active = category === entry.id
                return (
                  <button
                    key={entry.id}
                    type='button'
                    onClick={() => setCategory(entry.id)}
                    className={cn(
                      'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                    )}>
                    {entry.icon}
                    {entry.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className='max-h-[min(70vh,28rem)] overflow-y-auto'>
            {!canSearch && (
              <p className='px-3 py-4 text-sm text-muted-foreground'>
                Type at least {MIN_QUERY_LENGTH} characters to search.
              </p>
            )}

            {canSearch && !isFetching && !isError && totalResults === 0 && (
              <p className='px-3 py-4 text-sm text-muted-foreground'>No results found.</p>
            )}

            {grouped.map((entry) => (
              <div key={entry.group} className='px-1.5 py-1.5'>
                <p className='px-2 py-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase'>
                  {SEARCH_GROUP_LABELS[entry.group]}
                </p>
                <ul className='space-y-0.5'>
                  {entry.items.map((item) => {
                    runningIndex += 1
                    const index = runningIndex
                    const selected = index === selectedIndex
                    return (
                      <li key={`${item.group}:${item.id}`}>
                        <button
                          type='button'
                          role='option'
                          aria-selected={selected}
                          onMouseEnter={() => setSelectedIndex(index)}
                          onClick={() => openResult(item.href)}
                          className={cn(
                            'flex w-full cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-left transition-colors',
                            selected ? 'bg-accent' : 'hover:bg-accent/60',
                          )}>
                          {GROUP_ICONS[item.group]}
                          <span className='min-w-0 flex-1'>
                            <span className='block truncate text-sm font-medium'>{item.title}</span>
                            {item.subtitle ? (
                              <span className='block truncate text-xs text-muted-foreground'>
                                {item.subtitle}
                              </span>
                            ) : null}
                          </span>
                          {item.badge ? (
                            <span className='mt-0.5 shrink-0 text-[10px] tracking-wide text-muted-foreground uppercase'>
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
