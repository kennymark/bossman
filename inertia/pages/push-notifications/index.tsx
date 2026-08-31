import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, Link, router } from '@inertiajs/react'
import { IconBell, IconPlus, IconRefresh } from '@tabler/icons-react'
import { useState } from 'react'

import type { Column, PaginatedResponse } from '#types/extra'
import { timeAgo } from '#utils/date'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { tablePagination } from '@/lib/pagination'

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
  errorMessage: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface PushNotificationsIndexProps extends SharedProps {
  notifications?: PaginatedResponse<RawPushNotification>
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
      width: 120,
      cell: (row) => {
        const badge = (
          <Badge variant={statusVariant[row.status] ?? 'secondary'} className='capitalize'>
            {row.status}
          </Badge>
        )
        const errorText =
          row.status === 'failed' && row.errorMessage
            ? (() => {
                try {
                  const parsed = JSON.parse(row.errorMessage) as Record<string, string>
                  return typeof parsed.request === 'string'
                    ? parsed.request
                    : (Object.values(parsed)[0] ?? row.errorMessage)
                } catch {
                  return row.errorMessage
                }
              })()
            : null
        return errorText ? (
          <Tooltip>
            <TooltipTrigger>{badge}</TooltipTrigger>
            <TooltipContent side='top' className='max-w-sm'>
              <p className='text-sm'>{errorText}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          badge
        )
      },
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
            leftIcon={<IconRefresh className='h-4 w-4' />}
            isLoading={resendingId === row.id}
            loadingText='Sending…'
            disabled={resendingId === row.id}
            onClick={() => {
              setResendingId(row.id)
              router.post(
                `/push-notifications/${row.id}/resend`,
                {},
                {
                  preserveScroll: true,
                  onFinish: () => setResendingId(null),
                },
              )
            }}>
            Resend
          </Button>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <DashboardPage
      title='Push notifications'
      description='Send push notifications to Togetha users via OneSignal.'
      actions={
        <Button asChild>
          <Link href='/push-notifications/create'>
            <IconPlus className='mr-2 h-4 w-4' />
            Send notification
          </Link>
        </Button>
      }>
      <Deferred data='notifications' fallback={<LoadingSkeleton type='table' />}>
        <AppCard
          title={
            <span className='flex items-center gap-2'>
              <IconBell className='h-5 w-5' />
              Notifications
            </span>
          }
          description={`${(notifications?.metadata ?? notifications?.meta)?.total ?? 0} total`}>
          <DataTable
            columns={columns}
            data={notifications?.data ?? []}
            emptyMessage='No push notifications yet.'
            pagination={tablePagination(notifications ?? null, {
              onPageChange: changePage,
              onPageSizeChange: changeRows,
            })}
          />
        </AppCard>
      </Deferred>
    </DashboardPage>
  )
}
