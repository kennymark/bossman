import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { Activity, User as UserIcon } from 'lucide-react'
import type { Column, PaginatedResponse } from '#types/extra'
import { DataTable } from '@/components/dashboard/data-table'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/seperator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInertiaParams } from '@/hooks/use-inertia-params'

type AdminUserDetail = {
  id: string
  fullName: string | null
  email: string
  role: 'admin'
  pendingEmail?: string | null
  emailVerified?: boolean
  twoFactorEnabled?: boolean
  settings?: Record<string, unknown> | null
  lastLoginAt?: string | null
  createdAt?: string | null
}

type ActivityRow = {
  id: number
  event: string
  auditable_type: string
  auditable_id: number
  metadata: unknown
  created_at: string | null
}

type ActivityTableRow = Omit<ActivityRow, 'id'> & { id: string }

interface AdminUserPageProps extends SharedProps {
  targetUser: AdminUserDetail
  activity: PaginatedResponse<ActivityRow>
}

const activityColumns: Column<ActivityTableRow>[] = [
  {
    key: 'event',
    header: 'Event',
    cell: (row) => <Badge variant='secondary'>{row.event}</Badge>,
  },
  {
    key: 'auditable_type',
    header: 'Resource',
    cell: (row) => (
      <span className='text-muted-foreground'>
        {row.auditable_type}#{row.auditable_id}
      </span>
    ),
  },
  {
    key: 'created_at',
    header: 'When',
    cell: (row) => (
      <span className='text-muted-foreground'>
        {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
      </span>
    ),
  },
]

const validTabs = ['details', 'activity'] as const
type TabValue = (typeof validTabs)[number]

export default function AdminUserPage({ targetUser, activity }: AdminUserPageProps) {
  const page = usePage<SharedProps>()
  const qs = (page.props.qs as { tab?: string }) || {}
  const currentTab = (qs.tab && validTabs.includes(qs.tab as TabValue) ? qs.tab : 'details') as TabValue
  const activityTableData: ActivityTableRow[] = activity.data.map((row) => ({ ...row, id: String(row.id) }))

  const { changePage, changeRows, searchTable, query } = useInertiaParams({
    page: 1,
    perPage: 20,
    search: '',
    tab: currentTab,
  })

  const setTab = (tab: TabValue) => {
    router.get(
      `/users/${targetUser.id}`,
      { ...query, tab, page: 1 },
      { preserveScroll: true, preserveState: true },
    )
  }

  return (
    <DashboardLayout>
      <Head title={`User: ${targetUser.email}`} />
      <div className='space-y-6'>
        <PageHeader
          backHref='/users'
          title={targetUser.fullName || targetUser.email}
          description={targetUser.email}
          actions={
            <>
              <Button variant='outline' asChild>
                <Link href={`/users/${targetUser.id}/edit`}>Edit user</Link>
              </Button>
              {targetUser.role === 'admin' ? (
                <Badge variant='default'>Admin</Badge>
              ) : (
                <Badge variant='secondary'>Normal</Badge>
              )}
            </>
          }
        />

        <Tabs value={currentTab} onValueChange={(v) => setTab(v as TabValue)} className='space-y-6'>
          <TabsList>
            <TabsTrigger value='details' className='gap-2'>
              <UserIcon className='h-4 w-4' />
              Details
            </TabsTrigger>
            <TabsTrigger value='activity' className='gap-2'>
              <Activity className='h-4 w-4' />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value='details' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Basic information about this user.</CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 sm:grid-cols-2'>
                <Detail label='Full name' value={targetUser.fullName || '—'} />
                <Detail label='Email' value={targetUser.email} />
                <Detail label='Role' value={targetUser.role} />
                <Detail label='Email verified' value={targetUser.emailVerified ? 'Yes' : 'No'} />
                <Detail label='2FA enabled' value={targetUser.twoFactorEnabled ? 'Yes' : 'No'} />
                <Detail label='Pending email' value={targetUser.pendingEmail || '—'} />
                <Detail
                  label='Created'
                  value={targetUser.createdAt ? new Date(targetUser.createdAt).toLocaleString() : '—'}
                />
                <Detail
                  label='Last login'
                  value={targetUser.lastLoginAt ? new Date(targetUser.lastLoginAt).toLocaleString() : '—'}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Read-only view of this user’s notification settings.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <ReadOnlyNotificationSettings settings={targetUser.settings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='activity' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription>Audit events for this user.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={activityColumns}
                  data={activityTableData}
                  searchable
                  searchPlaceholder='Search activity...'
                  searchValue={String(query.search || '')}
                  onSearchChange={(value) => searchTable(String(value || ''))}
                  pagination={{
                    page: activity.meta.currentPage,
                    pageSize: activity.meta.perPage,
                    total: activity.meta.total,
                    onPageChange: changePage,
                    onPageSizeChange: changeRows,
                  }}
                  emptyMessage='No activity found'
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-1'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='text-sm font-medium'>{value}</div>
    </div>
  )
}

function ReadOnlyNotificationSettings({ settings }: { settings?: Record<string, unknown> | null }) {
  const notifications = (settings?.notifications as Record<string, unknown> | undefined) || {}
  const emailNotifications = Boolean(notifications.emailNotifications ?? true)
  const pushNotifications = Boolean(notifications.pushNotifications ?? true)
  const marketingEmails = Boolean(notifications.marketingEmails ?? false)

  return (
    <>
      <div className='flex items-center justify-between'>
        <div className='space-y-0.5'>
          <Label>Email Notifications</Label>
          <p className='text-sm text-muted-foreground'>Receive notifications via email</p>
        </div>
        <Switch checked={emailNotifications} disabled />
      </div>

      <Separator />

      <div className='flex items-center justify-between'>
        <div className='space-y-0.5'>
          <Label>Push Notifications</Label>
          <p className='text-sm text-muted-foreground'>Receive real-time push notifications in your browser</p>
        </div>
        <Switch checked={pushNotifications} disabled />
      </div>

      <Separator />

      <div className='flex items-center justify-between'>
        <div className='space-y-0.5'>
          <Label>Marketing Emails</Label>
          <p className='text-sm text-muted-foreground'>Receive emails about new features and updates</p>
        </div>
        <Switch checked={marketingEmails} disabled />
      </div>
    </>
  )
}

