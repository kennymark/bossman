import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, router, usePage } from '@inertiajs/react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileTab } from './profile-tab'
import { PasswordTab } from './password-tab'
import { NotificationsTab } from './notifications-tab'
import { SessionsTab } from './sessions-tab'

const validTabs = ['profile', 'password', 'notifications', 'sessions'] as const
type TabValue = (typeof validTabs)[number]

export default function Settings(_props: SharedProps) {
  const page = usePage()
  const qs = (page.props.qs as { tab?: string }) || {}
  const currentTab = (qs.tab && validTabs.includes(qs.tab as TabValue)
    ? qs.tab
    : 'profile') as TabValue

  const handleTabChange = (value: string) => {
    if (validTabs.includes(value as TabValue)) {
      router.get('/settings', { tab: value }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      })
    }
  }

  return (
    <DashboardLayout>
      <Head title='Settings' />
      <div className='space-y-6'>
        <PageHeader title='Settings' description='Manage your account settings and preferences.' />

        <Tabs value={currentTab} onValueChange={handleTabChange} className='space-y-6'>
          <TabsList>
            <TabsTrigger value='profile'>Profile</TabsTrigger>
            <TabsTrigger value='password'>Password</TabsTrigger>
            <TabsTrigger value='notifications'>Notifications</TabsTrigger>
            <TabsTrigger value='sessions'>Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value='profile' className='space-y-6'>
            <ProfileTab />
          </TabsContent>

          <TabsContent value='password'>
            <PasswordTab />
          </TabsContent>

          <TabsContent value='notifications'>
            <NotificationsTab />
          </TabsContent>

          <TabsContent value='sessions'>
            <SessionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
