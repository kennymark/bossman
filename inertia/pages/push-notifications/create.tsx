import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link, useForm } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'

import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/http'

type TogethaUserOption = { id: string; name: string; email: string; accountType: string }

const targetTypeOptions = [
  { value: 'all', label: 'All users', description: 'Send to every Togetha user.' },
  {
    value: 'all_landlords',
    label: 'All landlords',
    description: 'Send to all users with a landlord account.',
  },
  {
    value: 'all_tenants',
    label: 'All tenants',
    description: 'Send to all users with a tenant account.',
  },
  {
    value: 'all_agencies',
    label: 'All agencies',
    description: 'Send to all users with an agency account.',
  },
  {
    value: 'specific',
    label: 'Specific users',
    description: 'Choose individual users to target.',
  },
]

interface PushNotificationsCreateProps extends SharedProps { }

export default function PushNotificationsCreate(_props: PushNotificationsCreateProps) {
  const [userSearch, setUserSearch] = useState('')
  const { data, setData, post, processing, errors } = useForm({
    targetType: 'all' as 'all' | 'all_landlords' | 'all_tenants' | 'all_agencies' | 'specific',
    targetUserIds: [] as string[],
    title: '',
    description: '',
    imageUrl: '',
    url: '',
    sendAt: '', // empty = send now; ISO string = schedule
  })

  const { data: users = [] } = useQuery({
    queryKey: ['push-notifications-users', userSearch],
    queryFn: async () => {
      const res = await api.get<TogethaUserOption[]>('/push-notifications/users', {
        params: userSearch ? { search: userSearch } : undefined,
      })
      return Array.isArray(res.data) ? res.data : []
    },
  })

  const toggleUser = (id: string) => {
    setData(
      'targetUserIds',
      data.targetUserIds.includes(id)
        ? data.targetUserIds.filter((x) => x !== id)
        : [...data.targetUserIds, id],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/push-notifications', { preserveScroll: true })
  }

  return (
    <DashboardLayout>
      <Head title='Send push notification' />
      <div className='space-y-6'>
        <PageHeader
          backHref='/push-notifications'
          title='Send push notification'
          description='Target Togetha users (landlords, agencies, tenants).'
        />

        <form onSubmit={handleSubmit} className='space-y-6'>
          <AppCard title='Audience' description='Who should receive this notification?'>
            <RadioGroup
              spacing={2}
              options={targetTypeOptions}
              orientation='vertical'

              value={data.targetType}
              onChange={(value) => setData('targetType', value as typeof data.targetType)}
            />
            {data.targetType === 'specific' && (
              <div className='space-y-2'>
                <Label>Select users</Label>
                <Input
                  placeholder='Search by name or email...'
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className='max-w-sm'
                />
                <ScrollArea className='h-[200px] rounded-md border p-2'>
                  <div className='space-y-2'>
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className='flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50'>
                        <input
                          type='checkbox'
                          checked={data.targetUserIds.includes(user.id)}
                          onChange={() => toggleUser(user.id)}
                        />
                        <span className='text-sm'>
                          {user.name} ({user.email}) —{' '}
                          <span className='text-muted-foreground capitalize'>
                            {user.accountType}
                          </span>
                        </span>
                      </label>
                    ))}
                    {users.length === 0 && (
                      <p className='py-4 text-center text-sm text-muted-foreground'>
                        {userSearch ? 'No users match your search.' : 'Loading users...'}
                      </p>
                    )}
                  </div>
                </ScrollArea>
                {errors.targetUserIds && (
                  <p className='text-sm text-destructive'>{errors.targetUserIds}</p>
                )}
              </div>
            )}
          </AppCard>

          <AppCard title='Content' description='What should the notification say?'>
            <FormField label='Title' htmlFor='title' required error={errors.title}>
              <Input
                id='title'
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                placeholder='Notification title'
                required
              />
            </FormField>
            <FormField
              label='Description'
              htmlFor='description'
              required
              error={errors.description}>
              <Textarea
                id='description'
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                placeholder='Notification body text'
                rows={3}
                required
              />
            </FormField>
            <FormField label='Image URL' htmlFor='imageUrl' error={errors.imageUrl}>
              <Input
                id='imageUrl'
                type='url'
                value={data.imageUrl}
                onChange={(e) => setData('imageUrl', e.target.value)}
                placeholder='https://example.com/image.jpg (optional)'
              />
            </FormField>
            <FormField label='URL' htmlFor='url' error={errors.url}>
              <Input
                id='url'
                type='url'
                value={data.url}
                onChange={(e) => setData('url', e.target.value)}
                placeholder='https://... (optional, opens when tapped)'
              />
            </FormField>
          </AppCard>

          <AppCard title='When to send' description='Send now or schedule for later.'>
            <div className='flex flex-wrap gap-4'>
              <label className='flex cursor-pointer items-center gap-2'>
                <input
                  type='radio'
                  name='when'
                  checked={!data.sendAt}
                  onChange={() => setData('sendAt', '')}
                  className='h-4 w-4'
                />
                <span>Send now</span>
              </label>
              <label className='flex cursor-pointer items-center gap-2'>
                <input
                  type='radio'
                  name='when'
                  checked={!!data.sendAt}
                  onChange={() => {
                    if (!data.sendAt) {
                      const d = new Date()
                      d.setMinutes(d.getMinutes() + 5)
                      setData('sendAt', d.toISOString().slice(0, 16))
                    }
                  }}
                  className='h-4 w-4'
                />
                <span>Schedule for later</span>
              </label>
            </div>
            {data.sendAt && (
              <FormField label='Send at (local time)' htmlFor='sendAt'>
                <Input
                  id='sendAt'
                  type='datetime-local'
                  value={data.sendAt.slice(0, 16)}
                  onChange={(e) =>
                    setData(
                      'sendAt',
                      e.target.value ? new Date(e.target.value).toISOString() : '',
                    )
                  }
                />
              </FormField>
            )}
          </AppCard>

          <div className='flex gap-2'>
            <Button type='submit' disabled={processing}>
              {processing ? 'Sending…' : data.sendAt ? 'Schedule notification' : 'Send now'}
            </Button>
            <Button type='button' variant='outline' asChild>
              <Link href='/push-notifications'>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
