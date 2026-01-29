import { Link } from '@inertiajs/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { PaginatedResponse } from '#types/extra'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import api from '@/lib/http'
import { useRealTimeClient } from '@/lib/transmit'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  actions?: Array<{
    label: string
    url?: string
    action?: string
    variant?: 'default' | 'destructive' | 'outline'
  }>
  createdAt: string
}

interface NotificationCenterProps {
  userId: string
  initialUnreadCount?: number
}

export function NotificationCenter({ userId, initialUnreadCount = 0 }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Query keys
  const notificationsQueryKey = ['notifications', userId]
  const unreadCountQueryKey = ['notifications', 'unread-count', userId]

  // Fetch notifications when dropdown opens
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: async () => {
      return await api.get<{
        notifications: PaginatedResponse<Notification>
        unreadCount: number
      }>('/notifications', { params: { perPage: 10 } })


    },
    enabled: isOpen,
    staleTime: 30000, // 30 seconds
  })

  console.log(notificationsData)

  const notifications = notificationsData?.data?.notifications.data || []
  const unreadCount = notificationsData?.data?.unreadCount ?? initialUnreadCount


  // Fetch unread count separately (can be used independently)
  const { data: unreadCountData } = useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count')
      const data = res.data as { unreadCount: number }
      return data.unreadCount || 0
    },
    enabled: !isOpen, // Only fetch when dropdown is closed
    refetchInterval: 30000, // Refetch every 30 seconds when dropdown is closed
    initialData: initialUnreadCount,
  })

  const currentUnreadCount = isOpen ? unreadCount : (unreadCountData ?? initialUnreadCount)

  // Mark as read mutation
  const { mutate: markAsReadMutation } = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post('/notifications/mark-as-read', { notificationId })
    },
    onSuccess: () => refetchNotifications(),
  })

  // Mark all as read mutation
  const { mutate: markAllAsReadMutation } = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/mark-all-as-read')
    },
    onSuccess: () => refetchNotifications(),
  })

  // Delete notification mutation
  const { mutate: deleteNotificationMutation } = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`)
    },
    onSuccess: () => refetchNotifications(),
  })

  // Listen for real-time notifications
  useRealTimeClient({
    channel: `notification:${userId}`,
    onMessage: (data: { type: string; notification?: Notification; notificationId?: string }) => {
      if (data.type === 'notification') {
        toast.info(data.notification?.title || 'Notification', {
          description: data.notification?.message || 'No message',
        })
        // Refetch notifications to update the list if dropdown is open
        refetchNotifications()
      }
    },
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {currentUnreadCount > 0 && (
            <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white'>
              {currentUnreadCount > 9 ? '9+' : currentUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80 p-0'>
        <div className='flex items-center justify-between border-b p-4'>
          <h3 className='font-semibold'>Notifications</h3>
          {currentUnreadCount > 0 && (
            <Button variant='ghost' size='sm' onClick={() => markAllAsReadMutation()}>
              <CheckCheck className='mr-2 h-4 w-4' />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className='h-96'>
          {notifications.length === 0 ? (
            <div className='p-8 text-center text-sm text-muted-foreground'>No notifications</div>
          ) : (
            <div className='divide-y'>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-muted/50 transition-colors',
                    !notification.read && 'bg-muted/30',
                  )}>
                  <div className='flex items-start gap-3'>
                    <div
                      className={cn(
                        'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                        getTypeColor(notification.type),
                      )}
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1'>
                          <p className='text-sm font-medium'>{notification.title}</p>
                          <p className='text-xs text-muted-foreground mt-1'>
                            {notification.message}
                          </p>
                        </div>
                        <div className='flex items-center gap-1'>
                          {!notification.read && (
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6'
                              onClick={() => markAsReadMutation(notification.id)}>
                              <Check className='h-3 w-3' />
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            onClick={() => deleteNotificationMutation(notification.id)}>
                            <X className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>
                      {notification.actions && notification.actions.length > 0 && (
                        <div className='mt-2 flex gap-2'>
                          {notification.actions.map(
                            (action: {
                              label: string
                              url?: string
                              action?: string
                              variant?: 'default' | 'destructive' | 'outline'
                            }) => (
                              <Button
                                key={action.label}
                                variant={action.variant || 'outline'}
                                size='sm'
                                className='text-xs'
                                asChild={!!action.url}
                                type={action.url ? undefined : 'button'}>
                                {action.url ? (
                                  <Link href={action.url}>{action.label}</Link>
                                ) : (
                                  <button
                                    type='button'
                                    onClick={() => action.action && console.log(action.action)}>
                                    {action.label}
                                  </button>
                                )}
                              </Button>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className='border-t p-2'>
          <Button variant='ghost' size='sm' className='w-full text-xs' asChild>
            <Link href='/notifications' className='text-xs'>View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
