import type { SharedProps } from '@adonisjs/inertia/types'
import { Link, useForm } from '@inertiajs/react'
import { IconUserX } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'

import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { EmptyState, SimpleGrid } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-time-picker'
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

interface PushNotificationsCreateProps extends SharedProps {}

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
    <DashboardPage
      title='Send push notification'
      description='Target Togetha users (landlords, agencies, tenants).'
      backHref='/push-notifications'>
      <form onSubmit={handleSubmit} className='space-y-6'>
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
          <FormField label='Description' htmlFor='description' required error={errors.description}>
            <Textarea
              id='description'
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              placeholder='Notification body text'
              rows={3}
              required
            />
          </FormField>
          <SimpleGrid cols={2}>
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
          </SimpleGrid>

          <Label className='mt-4'>Audience</Label>
          <RadioGroup
            spacing={2}
            cols={5}
            options={targetTypeOptions}
            value={data.targetType}
            onChange={(value) => setData('targetType', value as typeof data.targetType)}
          />
          {data.targetType === 'specific' && (
            <div className='space-y-2 my-2'>
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
                        <span className='text-muted-foreground capitalize'>{user.accountType}</span>
                      </span>
                    </label>
                  ))}
                  {users.length === 0 &&
                    (userSearch ? (
                      <EmptyState
                        icon={IconUserX}
                        title='No users match your search'
                        description='Try a different search term.'
                        className='py-6'
                      />
                    ) : (
                      <p className='py-4 text-center text-sm text-muted-foreground'>
                        Loading users...
                      </p>
                    ))}
                </div>
              </ScrollArea>
              {errors.targetUserIds && (
                <p className='text-sm text-destructive'>{errors.targetUserIds}</p>
              )}
            </div>
          )}
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
              <DateTimePicker
                id='sendAt'
                value={data.sendAt ? format(new Date(data.sendAt), "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(value) => setData('sendAt', value ? new Date(value).toISOString() : '')}
                placeholder='Pick date & time'
                clearable
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
    </DashboardPage>
  )
}
