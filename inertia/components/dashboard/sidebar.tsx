import { Link, router, usePage } from '@inertiajs/react'
import {
  IconChartBar,
  IconBell,
  IconClockPlay,
  IconFiles,
  IconTool,
  IconBuilding,
  IconSelector,
  IconDatabase,
  IconDeviceLaptop,
  IconFileText,
  IconLayoutDashboard,
  IconLogout,
  IconMail,
  IconMenu2,
  IconMoon,
  IconNews,
  IconPackage,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogs,
  IconPlugConnected,
  IconServer,
  IconShieldLock,
  IconSettings,
  IconStack,
  IconSun,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react'

import type { RawUser } from '#types/model-types'
import { startCase } from '#utils/functions'
import { CommandPalette, CommandPaletteTrigger } from '@/components/command-palette'
import { GlobalSearch } from '@/components/dashboard/global-search'
import { PageCommandsProvider } from '@/contexts/page-commands'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BaseSheet } from '@/components/ui/base-sheet'
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
import { LogoFull } from '@/components/ui/logo-full'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useEnvironment } from '@/hooks/use-environment'
import { useSidebar } from '@/hooks/use-sidebar'
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
    label: 'Togetha',
    items: [
      { title: 'Analytics', href: '/analytics', icon: <IconChartBar className='h-4 w-4' /> },
      { title: 'Dashboard', href: '/dashboard', icon: <IconLayoutDashboard className='h-4 w-4' /> },
      { title: 'Leases', href: '/leases', icon: <IconFileText className='h-4 w-4' /> },
      {
        title: 'Properties',
        href: '/properties',
        icon: <IconStack className='h-4 w-4' />,
      },
      { title: 'Customers', href: '/orgs', icon: <IconBuilding className='h-4 w-4' /> },
      { title: 'Maintenance', href: '/maintenance', icon: <IconTool className='h-4 w-4' /> },
      { title: 'Documents', href: '/documents', icon: <IconFiles className='h-4 w-4' /> },
    ],
  },
]

const adminNavSections: NavSection[] = [
  {
    label: 'Admin',
    items: [
      {
        title: 'Push notifications',
        href: '/push-notifications',
        icon: <IconBell className='h-4 w-4' />,
      },
      { title: 'Teams', href: '/teams', icon: <IconUsers className='h-4 w-4' /> },

      { title: 'Emails', href: '/emails', icon: <IconMail className='h-4 w-4' /> },
      { title: 'Blog', href: '/blog/manage', icon: <IconNews className='h-4 w-4' /> },
      { title: 'Addons', href: '/addons', icon: <IconPackage className='h-4 w-4' /> },
    ],
  },
]

const developerNavSections: NavSection[] = [
  {
    label: 'Developer',
    items: [
      { title: 'Servers', href: '/servers', icon: <IconServer className='h-4 w-4' /> },
      { title: 'Backups', href: '/db-backups', icon: <IconDatabase className='h-4 w-4' /> },
      { title: 'Jobs', href: '/jobs', icon: <IconClockPlay className='h-4 w-4' /> },
      { title: 'API & MCP', href: '/api-access', icon: <IconPlugConnected className='h-4 w-4' /> },
      /**
       * Not page-gated: every admin can read their own trail, and the controller widens
       * the scope to everyone's for god and super admins.
       */
      { title: 'Audit trail', href: '/audits', icon: <IconShieldLock className='h-4 w-4' /> },
    ],
  },
]

interface SidebarProps {
  children?: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const page = usePage()
  const user = page.props.user as RawUser
  const { theme, setTheme } = useTheme()
  const { environment, setEnvironment } = useEnvironment()
  const {
    isOpen,
    isMobile,
    isMobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
    toggleSidebar,
    showSectionLabels,
  } = useSidebar()
  const pageAccess = (page.props as { pageAccess?: string[] | null }).pageAccess
  const enableProdAccess = (page.props as { enableProdAccess?: boolean }).enableProdAccess ?? true
  const showEnvironmentSwitcher =
    (page.props as { showEnvironmentSwitcher?: boolean }).showEnvironmentSwitcher ?? false
  /** 'read' means production is visible but every write to customer data is refused. */
  const prodAccessMode = (page.props as { prodAccessMode?: 'read' | 'write' | null }).prodAccessMode

  /** Maps nav href to the page key used in pageAccess (must match backend PAGE_KEY_TO_PATH). */
  const pathToPageKey = (href: string): string | null => {
    const path = `/${String(href || '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')}`
    if (path === '/analytics') return 'analytics'
    if (path.startsWith('/api-access')) return 'apiAccess'
    if (path === '/dashboard') return 'dashboard'
    if (path.startsWith('/teams')) return 'teams'
    if (path.startsWith('/blog/manage')) return 'blog'
    if (path.startsWith('/orgs')) return 'orgs'
    if (path.startsWith('/leases')) return 'leases'
    if (path.startsWith('/properties')) return 'properties'
    if (path.startsWith('/push-notifications')) return 'pushNotifications'
    if (path.startsWith('/db-backups')) return 'dbBackups'
    if (path.startsWith('/logs')) return 'logs'
    if (path.startsWith('/emails')) return 'emails'
    if (path.startsWith('/servers')) return 'servers'
    if (path.startsWith('/addons')) return 'addons'
    if (path.startsWith('/maintenance')) return 'maintenance'
    if (path.startsWith('/documents')) return 'documents'
    if (path.startsWith('/jobs')) return 'jobs'
    return null
  }

  const canSeePage = (href: string) => {
    if (href === '/settings') return true
    const key = pathToPageKey(href)
    if (key === null) return true
    if (!pageAccess) return true
    return pageAccess.includes(key)
  }

  const allNavSections: NavSection[] = [
    ...appNavSections,
    ...adminNavSections,
    ...developerNavSections,
  ]
  const effectiveNavSections: NavSection[] = allNavSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => canSeePage(item.href)),
  }))

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
      'flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors',
      !isOpen && !isMobile && 'justify-center px-2',
      isActive
        ? 'bg-primary text-sidebar-primary-foreground hover:bg-primary hover:text-sidebar-primary-foreground'
        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
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
                onClick={closeMobileMenu}
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
        onClick={() => isMobile && closeMobileMenu()}
        className={linkClassName}>
        <span className={cn('transition-transform', isActive && 'scale-110')}>{item.icon}</span>
        {(isOpen || isMobile) && <span>{item.title}</span>}
      </Link>
    )
  }

  const SectionLabel = ({ children }: { children: string }) => (
    <div
      className={cn(
        'px-2.5 pb-1 pt-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase',
        !showSectionLabels && 'hidden',
      )}>
      {children}
    </div>
  )

  const SidebarContent = () => (
    <>
      {/* Logo/Header – same horizontal padding as nav so logo aligns with content; hidden when sidebar closed */}
      <div className={cn('flex h-14 shrink-0 items-center px-1.5', !isOpen && 'px-2')}>
        <div className='flex flex-1 min-w-0 items-center'>
          {(isOpen || isMobile) && (
            <Link
              href='/'
              className='flex items-center pl-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md'>
              <LogoFull className='text-sidebar-foreground' heightClass='h-8' />
            </Link>
          )}
        </div>
        <div className={cn('flex items-center', !isOpen && !isMobile && 'mx-auto')}>
          {isMobile ? (
            <Button variant='ghost' size='icon' onClick={closeMobileMenu} aria-label='Close menu'>
              <IconLayoutSidebarLeftCollapse className='h-5 w-5' />
            </Button>
          ) : (
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleSidebar}
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
              {isOpen ? (
                <IconLayoutSidebarLeftCollapse className='h-5 w-5' />
              ) : (
                <IconLayoutSidebarLeftExpand className='h-6 w-6' />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className='flex-1 min-h-0 px-1.5 py-1.5'>
        {!showSectionLabels ? (
          <nav className='space-y-0.5'>
            {effectiveNavSections.flatMap((s) => s.items).map(renderItem)}
          </nav>
        ) : (
          <nav className='space-y-0.5 px-6'>
            {effectiveNavSections.map((section) => (
              <div key={section.label}>
                <SectionLabel>{section.label}</SectionLabel>
                <div className='space-y-0.5'>{section.items.map(renderItem)}</div>
              </div>
            ))}
          </nav>
        )}
      </ScrollArea>

      {enableProdAccess && (
        <div className='border-t p-3 text-center'>
          <span
            className={`text-xs font-bold text-center text-${environment === 'prod' ? 'green' : 'red'}-500`}>
            {startCase(environment)}{' '}
          </span>
          {environment === 'prod' && prodAccessMode === 'read' && (
            <span className='ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'>
              Read-only
            </span>
          )}
        </div>
      )}
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
                <IconSelector className='h-4 w-4 text-muted-foreground shrink-0' />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side='top' align='start' sideOffset={10} className='w-72 p-2'>
            <div className='px-3 py-2'>
              <div className='text-xs text-muted-foreground'>Signed in as</div>
              <div className='truncate text-sm font-medium'>{user?.email || '—'}</div>
            </div>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.visit('/settings')}>
              <IconSettings className='h-4 w-4' />
              Settings
            </DropdownMenuItem>

            {showEnvironmentSwitcher && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <IconWorld className='h-4 w-4' />
                    Environment
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent side='right' align='start' className='p-2'>
                    <DropdownMenuRadioGroup
                      value={environment}
                      onValueChange={(v) => setEnvironment(v as 'prod' | 'dev')}>
                      <DropdownMenuRadioItem value='prod'>
                        <IconSun className='h-4 w-4' />
                        Production
                      </DropdownMenuRadioItem>

                      <DropdownMenuRadioItem value='dev'>
                        <IconDeviceLaptop className='h-4 w-4' />
                        Development
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconSun className='h-4 w-4' />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent side='right' align='start' className='p-2'>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
                  <DropdownMenuRadioItem value='light'>
                    <IconSun className='h-4 w-4' />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='dark'>
                    <IconMoon className='h-4 w-4' />
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='system'>
                    <IconDeviceLaptop className='h-4 w-4' />
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant='destructive' onClick={() => router.visit('/logout')}>
              <IconLogout className='h-4 w-4' />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )

  return (
    <PageCommandsProvider>
      <div className='flex h-screen overflow-hidden bg-background'>
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden md:flex min-h-0 flex-col border-r border-sidebar-border bg-sidebar shadow-sm transition-all duration-300',
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
          <BaseSheet
            open={isMobileMenuOpen}
            onOpenChange={closeMobileMenu}
            side='left'
            className='w-64 p-0 bg-sidebar'
            contentStyle={{
              backgroundColor: 'var(--sidebar-background)',
              color: 'var(--sidebar-foreground)',
            }}>
            <SidebarContent />
          </BaseSheet>
        )}

        {/* Main content */}
        <main className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-background'>
          <CommandPalette />
          {/* Header */}
          <div className='sticky top-0 z-30 border-b border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-sm'>
            <div className='w-full flex h-16 items-center justify-between gap-2 px-4 sm:px-6'>
              <div className='flex items-center gap-2'>
                {isMobile && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={openMobileMenu}
                    aria-label='Open menu'>
                    <IconMenu2 className='h-5 w-5' />
                  </Button>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <GlobalSearch />
                <CommandPaletteTrigger />
                {user?.id && <NotificationCenter userId={user.id} />}
              </div>
            </div>
          </div>
          <div className='container mx-auto p-4 sm:p-6'>{children}</div>
        </main>
      </div>
    </PageCommandsProvider>
  )
}
