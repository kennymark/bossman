import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link, router } from '@inertiajs/react'
import { Bell, Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type { Column, PaginatedResponse } from '#types/extra'
import { timeAgo } from '#utils/date'
import { DataTable } from '@/components/dashboard/data-table'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useInertiaParams } from '@/hooks/use-inertia-params'

export type RawPushNotification = {
  id: string
  targetType: string
  targetUserIds: string[] | null
  title: string
  description: string
  imageUrl: string | null
  url: string | null
  scheduledAt: string | null
  sentAt: string | null
  status: string
  createdAt: string
}

interface PushNotificationsIndexProps extends SharedProps {
  notifications: PaginatedResponse<RawPushNotification>
}

const targetTypeLabel: Record<string, string> = {
  all: 'All users',
  all_landlords: 'All landlords',
  all_tenants: 'All tenants',
  all_agencies: 'All agencies',
  specific: 'Specific users',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  sent: 'default',
  pending: 'secondary',
  failed: 'destructive',
  cancelled: 'outline',
}

export default function PushNotificationsIndex({ notifications }: PushNotificationsIndexProps) {
  const { changePage, changeRows } = useInertiaParams({ page: 1, perPage: 20 })
  const [resendingId, setResendingId] = useState<string | null>(null)

  const columns: Column<RawPushNotification>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (row) => <span className='font-medium'>{row.title}</span>,
    },
    {
      key: 'targetType',
      header: 'Target',
      width: 140,
      cell: (row) => (
        <Badge variant='outline' className='capitalize'>
          {targetTypeLabel[row.targetType] ?? row.targetType}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 100,
      cell: (row) => (
        <Badge variant={statusVariant[row.status] ?? 'secondary'} className='capitalize'>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'sentAt',
      header: 'Sent / Scheduled',
      width: 160,
      cell: (row) =>
        row.sentAt
          ? timeAgo(row.sentAt)
          : row.scheduledAt
            ? `Scheduled ${timeAgo(row.scheduledAt)}`
            : '—',
    },
    {
      key: 'createdAt',
      header: 'Created',

      cell: (row) => timeAgo(row.createdAt ?? ''),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 140,
      cell: (row) =>
        row.status === 'failed' ? (
          <Button
            variant='outline'
            size='sm'
            leftIcon={<RefreshCw className='h-4 w-4' />}
            isLoading={resendingId === row.id}
            loadingText='Sending…'
            disabled={resendingId === row.id}
            onClick={() => {
              setResendingId(row.id)
              router.post(`/push-notifications/${row.id}/resend`, {}, {
                preserveScroll: true,
                onFinish: () => setResendingId(null),
              })
            }}>
            Resend
          </Button>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <DashboardLayout>
      <Head title='Push notifications' />
      <div className='space-y-6'>
        <PageHeader
          title='Push notifications'
          description='Send push notifications to Togetha users via OneSignal.'
          actions={
            <Button asChild>
              <Link href='/push-notifications/create'>
                <Plus className='mr-2 h-4 w-4' />
                Send notification
              </Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5' />
              Notifications
            </CardTitle>
            <CardDescription>{notifications.meta.total} total</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={notifications.data}
              emptyMessage='No push notifications yet.'
              pagination={{
                page: notifications.meta.currentPage,
                pageSize: notifications.meta.perPage,
                total: notifications.meta.total,
                onPageChange: changePage,
                onPageSizeChange: changeRows,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
