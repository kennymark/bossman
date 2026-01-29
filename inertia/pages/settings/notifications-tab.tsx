import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/seperator'
import { Switch } from '@/components/ui/switch'
import api from '@/lib/http'

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
}

const defaultSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
}

export function NotificationsTab() {
  const queryClient = useQueryClient()

  // Fetch current settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const response = await api.get<{ settings: Record<string, unknown> | null }>('/user/settings')
      return response.data.settings || {}
    },
  })

  // Get notification settings from user settings or use defaults
  const notifications = (settingsData?.notifications as NotificationSettings | undefined)
  const notificationSettings: NotificationSettings = {
    emailNotifications: notifications?.emailNotifications ?? defaultSettings.emailNotifications,
    pushNotifications: notifications?.pushNotifications ?? defaultSettings.pushNotifications,
    marketingEmails: notifications?.marketingEmails ?? defaultSettings.marketingEmails,
  }

  // Notification settings mutation
  const { mutate: updateNotificationSettingsMutation, isPending } = useMutation({
    mutationFn: async (values: NotificationSettings) => {
      const response = await api.put<{ message: string; data: { settings: Record<string, unknown> } }>(
        '/user/settings',
        {
          settings: {
            notifications: values,
          },
        },
      )
      return response.data
    },
    onSuccess: (data) => {
      // Update the query cache with the new settings
      queryClient.setQueryData(['user-settings'], data.data.settings)
      toast.success('Notification settings updated!')
    },
    onError: () => {
      toast.error('Failed to update notification settings.')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications and updates.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='email-notifications'>Email Notifications</Label>
            <p className='text-sm text-muted-foreground'>Receive notifications via email</p>
          </div>
          <Switch
            id='email-notifications'
            checked={notificationSettings.emailNotifications}
            disabled={isPending || isLoading}
            onCheckedChange={(checked) => {
              const updatedSettings = {
                ...notificationSettings,
                emailNotifications: checked,
              }
              updateNotificationSettingsMutation(updatedSettings)
            }}
          />
        </div>

        <Separator />

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='push-notifications'>Push Notifications</Label>
            <p className='text-sm text-muted-foreground'>
              Receive real-time push notifications in your browser
            </p>
          </div>
          <Switch
            id='push-notifications'
            checked={notificationSettings.pushNotifications}
            disabled={isPending || isLoading}
            onCheckedChange={(checked) => {
              const updatedSettings = {
                ...notificationSettings,
                pushNotifications: checked,
              }
              updateNotificationSettingsMutation(updatedSettings)
            }}
          />
        </div>

        <Separator />

        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='marketing-emails'>Marketing Emails</Label>
            <p className='text-sm text-muted-foreground'>
              Receive emails about new features and updates
            </p>
          </div>
          <Switch
            id='marketing-emails'
            checked={notificationSettings.marketingEmails}
            disabled={isPending || isLoading}
            onCheckedChange={(checked) => {
              const updatedSettings = {
                ...notificationSettings,
                marketingEmails: checked,
              }
              updateNotificationSettingsMutation(updatedSettings)
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
