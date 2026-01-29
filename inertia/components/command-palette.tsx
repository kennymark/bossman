'use client'

import type { SharedProps } from '@adonisjs/inertia/types'
import { router, usePage } from '@inertiajs/react'
import { Check, LayoutDashboard, LogOut, Moon, Newspaper, PlusSquare, Settings, Sun, Users, UsersRound } from 'lucide-react'
import * as React from 'react'
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

type AdminPageKey = 'admin_dashboard' | 'admin_users' | 'admin_blog' | 'admin_teams'

type CommandEntry = {
  label: string
  href: string
  icon?: React.ReactNode
  keywords?: string
  requires?: AdminPageKey
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return target.isContentEditable
}

export function CommandPalette() {
  const page = usePage<SharedProps>()
  const isLoggedIn = Boolean(page.props.isLoggedIn)
  const { theme, setTheme } = useTheme()
  const adminPageAccess = (page.props as SharedProps & { adminPageAccess?: AdminPageKey[] | null }).adminPageAccess

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

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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

  // CmdK is only mounted in dashboard layouts, but keep a guard anyway.
  if (!isLoggedIn) return null

  const appNav: CommandEntry[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className='mr-2 h-4 w-4' />, requires: 'admin_dashboard' },
    { label: 'Users', href: '/users', icon: <Users className='mr-2 h-4 w-4' />, requires: 'admin_users' },
    { label: 'Teams', href: '/teams', icon: <UsersRound className='mr-2 h-4 w-4' />, requires: 'admin_teams' },
    { label: 'Blog', href: '/blog/manage', icon: <Newspaper className='mr-2 h-4 w-4' />, requires: 'admin_blog' },
    { label: 'New blog post', href: '/blog/manage/create', icon: <PlusSquare className='mr-2 h-4 w-4' />, requires: 'admin_blog' },
    { label: 'Blog categories', href: '/blog/manage/categories', icon: <Newspaper className='mr-2 h-4 w-4' />, requires: 'admin_blog' },
    { label: 'Blog tags', href: '/blog/manage/tags', icon: <Newspaper className='mr-2 h-4 w-4' />, requires: 'admin_blog' },
    { label: 'Blog authors', href: '/blog/manage/authors', icon: <Newspaper className='mr-2 h-4 w-4' />, requires: 'admin_blog' },
    { label: 'Settings', href: '/settings', icon: <Settings className='mr-2 h-4 w-4' /> },
  ]

  const accountActions: CommandEntry[] = [
    { label: 'Log out', href: '/logout', icon: <LogOut className='mr-2 h-4 w-4' /> },
  ]

  const visibleAppNav = (() => {
    if (!adminPageAccess) return appNav
    return appNav.filter((i) => !i.requires || adminPageAccess.includes(i.requires))
  })()

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search…' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading='App'>
          {visibleAppNav.map((item) => (
            <CommandItem
              key={item.href}
              className='cursor-pointer py-2'
              value={`${item.label} ${item.keywords || ''}`}
              onSelect={() => go(item.href)}
            >
              {item.icon}
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading='Theme'>
          <CommandItem value='Theme: Light' onSelect={() => selectTheme('light')}>
            <Sun className='mr-2 h-4 w-4' />
            Light
            {theme === 'light' ? <Check className='ml-auto h-4 w-4' /> : null}
          </CommandItem>
          <CommandItem value='Theme: Dark' onSelect={() => selectTheme('dark')}>
            <Moon className='mr-2 h-4 w-4' />
            Dark
            {theme === 'dark' ? <Check className='ml-auto h-4 w-4' /> : null}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading='Account'>
          {accountActions.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} ${item.keywords || ''}`}
              onSelect={() => go(item.href)}
            >
              {item.icon}
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

