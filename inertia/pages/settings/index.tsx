import type { SharedProps } from '@adonisjs/inertia/types'
import { router, usePage } from '@inertiajs/react'

import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInertiaParams } from '@/hooks/use-inertia-params'

import { NotificationsTab } from './notifications-tab'
import { PasswordTab } from './password-tab'
import { ProfileTab } from './profile-tab'
import { SessionsTab } from './sessions-tab'

export default function Settings(_props: SharedProps) {
  const { query, updateQuery } = useInertiaParams()
  const currentTab = query.tab ?? 'profile'
  const handleTabChange = (value: string) => {
    updateQuery({ tab: value })
  }

  return (
    <DashboardPage title='Settings' description='Manage your account settings and preferences.'>
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
    </DashboardPage>
  )
}
