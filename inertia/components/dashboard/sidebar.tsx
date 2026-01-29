import { Link, router, usePage } from '@inertiajs/react'
import {
  ChevronsUpDown,
  Laptop,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Newspaper,
  PanelLeft,
  PanelRight,
  Settings,
  Sun,
  Users,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { RawUser } from '#types/model-types'
import { CommandPalette } from '@/components/command-palette'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import useDisclosure from '@/hooks/use-disclosure'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

interface NavSection {
  label: string
  items: NavItem[]
}

const appNavSections: NavSection[] = [
  {
    label: 'App',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className='h-4 w-4' /> },
      { title: 'Users', href: '/users', icon: <Users className='h-4 w-4' /> },
      { title: 'Teams', href: '/teams', icon: <UsersRound className='h-4 w-4' /> },
      { title: 'Blog', href: '/blog/manage', icon: <Newspaper className='h-4 w-4' /> },
      { title: 'Settings', href: '/settings', icon: <Settings className='h-4 w-4' /> },
    ],
  },
]

const SIDEBAR_STORAGE_KEY = 'dashboard-sidebar-open'

// Read initial value from localStorage synchronously to avoid flash
const getInitialSidebarState = (): boolean => {
  if (typeof window === 'undefined') return true
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return stored !== null ? JSON.parse(stored) : true
  } catch {
    return true
  }
}

interface SidebarProps {
  children?: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const page = usePage()
  const user = page.props.user as RawUser
  const { theme, setTheme } = useTheme()

  const adminPageAccess = (page.props as { adminPageAccess?: string[] | null }).adminPageAccess

  const canSeeAdminHref = (href: string) => {
    if (!adminPageAccess) return true

    const key =
      href.startsWith('/users') ? 'admin_users'
        : href.startsWith('/teams') ? 'admin_teams'
          : href.startsWith('/blog/manage') ? 'admin_blog'
            : href === '/dashboard' ? 'admin_dashboard'
              : 'admin_dashboard'

    return adminPageAccess.includes(key)
  }

  const effectiveNavSections: NavSection[] = appNavSections.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => item.href === '/settings' || canSeeAdminHref(item.href),
    ),
  }))

  // Use useState with initial value from localStorage to avoid flash
  const [sidebarOpen, setSidebarOpenState] = useState(getInitialSidebarState())
  const { isOpen: isMobileMenuOpen, open: openMobileMenu, close: closeMobileMenu } = useDisclosure()
  const [isMobile, setIsMobile] = useState(false)

  // Sync to localStorage whenever sidebarOpen changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarOpen))
      }
    } catch (error) {
      console.error('Error saving sidebar state to localStorage:', error)
    }
  }, [sidebarOpen])

  // Toggle function that updates state (which will sync to localStorage)
  const toggleSidebar = () => {
    setSidebarOpenState((prev) => !prev)
  }

  // Ensure the dashboard scrolls inside the main panel, not the <body>.
  useEffect(() => {
    document.documentElement.classList.add('dashboard-shell')
    document.body.classList.add('dashboard-shell')
    return () => {
      document.documentElement.classList.remove('dashboard-shell')
      document.body.classList.remove('dashboard-shell')
    }
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        closeMobileMenu()
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isOpen = sidebarOpen
  const onToggle = toggleSidebar
  const onMobileClose = closeMobileMenu

  const showSectionLabels = isOpen || isMobile

  const currentPath = (() => {
    const url = String(page.url || '/')
    return url.split('?')[0]?.split('#')[0] || '/'
  })()

  const normalizePath = (value: string) => {
    if (!value) return '/'
    if (value === '/') return '/'
    return value.replace(/\/+$/, '')
  }

  const isNavItemActive = (href: string) => {
    const path = normalizePath(currentPath)
    const target = normalizePath(href)

    if (target === '/dashboard') return path === target

    return path === target || path.startsWith(`${target}/`)
  }

  const renderItem = (item: NavItem) => {
    const isActive = isNavItemActive(item.href)
    const linkClassName = cn(
      'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      !isOpen && !isMobile && 'justify-center px-2',
      isActive && 'bg-primary text-sidebar-primary-foreground',
    )

    // Desktop collapsed sidebar: show tooltip on hover
    if (!isOpen && !isMobile) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger
            delay={250}
            render={
              <Link
                href={item.href}
                onClick={() => onMobileClose?.()}
                className={linkClassName}
                aria-label={item.title}
                title={item.title}>
                <span className={cn('transition-transform', isActive && 'scale-110')}>
                  {item.icon}
                </span>
              </Link>
            }
          />
          <TooltipContent side='right' sideOffset={10}>
            {item.title}
          </TooltipContent>
        </Tooltip>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => isMobile && onMobileClose?.()}
        className={linkClassName}>
        <span className={cn('transition-transform', isActive && 'scale-110')}>{item.icon}</span>
        {(isOpen || isMobile) && <span>{item.title}</span>}
      </Link>
    )
  }

  const SectionLabel = ({ children }: { children: string }) => (
    <div
      className={cn(
        'px-2 pb-1 pt-3 text-[10px] font-medium tracking-wide text-gray-400 uppercase',
        !showSectionLabels && 'hidden',
      )}>
      {children}
    </div>
  )

  const SidebarContent = () => (
    <>
      {/* Logo/Header */}
      <div className='flex h-14 items-center px-3'>
        <div className='flex flex-1 items-center'>
          {(isOpen || isMobile) && (
            <Link href='/' >
              <div className='flex py-1 px-2 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                logo
              </div>
            </Link>
          )}
        </div>
        <div className={cn('flex items-center', !isOpen && !isMobile && 'mx-auto')}>
          {user?.id && <NotificationCenter userId={user.id} />}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className='flex-1 min-h-0 px-1.5 py-2'>
        {!showSectionLabels ? (
          <nav className='space-y-1'>
            {effectiveNavSections.flatMap((s) => s.items).map(renderItem)}
          </nav>
        ) : (
          <nav className='space-y-1'>
            {effectiveNavSections.map((section) => (
              <div key={section.label}>
                <SectionLabel>{section.label}</SectionLabel>
                <div className='space-y-1'>{section.items.map(renderItem)}</div>
              </div>
            ))}
          </nav>
        )}
      </ScrollArea>

      {/* User section */}
      <div className='border-t p-3'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className={cn(
                'w-full rounded-md px-2 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors',
                'flex items-center gap-3 text-left',
                !isOpen && !isMobile && 'justify-center px-2',
              )}>
              <Avatar className='h-7 w-7'>
                <AvatarFallback>
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {(isOpen || isMobile) && (
                <div className='flex-1 overflow-hidden'>
                  <p className='truncate text-[13px] font-medium leading-4'>
                    {user?.fullName || 'User'}
                  </p>
                  <p className='truncate text-[11px] text-muted-foreground'>{user?.email}</p>
                </div>
              )}
              {(isOpen || isMobile) && (
                <ChevronsUpDown className='h-4 w-4 text-muted-foreground shrink-0' />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side='top' align='start' sideOffset={10} className='w-72 p-2'>
            <div className='px-3 py-2'>
              <div className='text-xs text-muted-foreground'>Signed in as</div>
              <div className='truncate text-sm font-medium'>{user?.email || '—'}</div>
            </div>
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className='h-4 w-4' />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent side='right' align='start' className='p-2'>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
                  <DropdownMenuRadioItem value='light'>
                    <Sun className='h-4 w-4' />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='dark'>
                    <Moon className='h-4 w-4' />
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='system'>
                    <Laptop className='h-4 w-4' />
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant='destructive'
              onClick={() => router.visit('/logout')}>
              <LogOut className='h-4 w-4' />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex min-h-0 flex-col border-r border-border bg-sidebar transition-all duration-300',
          isOpen ? 'w-64' : 'w-16',
        )}
        style={{
          backgroundColor: 'var(--sidebar-background)',
          color: 'var(--sidebar-foreground)',
        }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={closeMobileMenu}>
          <SheetContent
            side='left'
            className='w-64 p-0 bg-sidebar'
            style={{
              backgroundColor: 'var(--sidebar-background)',
              color: 'var(--sidebar-foreground)',
            }}>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <main className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-background'>
        <CommandPalette />
        {/* Header with notifications */}
        <div className='sticky top-0 z-30 border-b border-border bg-background'>
          <div className='w-full flex h-16 items-center justify-between gap-2 px-4 sm:px-6'>
            <div className='flex items-center gap-2'>
              {isMobile ? (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={openMobileMenu}
                  className='md:hidden'>
                  <Menu className='h-5 w-5' />
                </Button>
              ) : (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={onToggle}
                  className='hidden md:inline-flex'>
                  {isOpen ? <PanelLeft className='h-5 w-5' /> : <PanelRight className='h-5 w-5' />}
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className='container mx-auto p-4 sm:p-6'>{children}</div>
      </main>
    </div>
  )
}
