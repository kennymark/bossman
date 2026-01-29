import { useMutation, useQuery } from '@tanstack/react-query'
import { LogOut, Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { RawSession } from '#types/model-types'
import { DataTable } from '@/components/dashboard/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { BaseDialog } from '@/components/ui/base-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingCard } from '@/components/ui/loading'
import { dateTimeFormatter, timeAgo } from '@/lib/date'
import api from '@/lib/http'

function getDeviceIcon(deviceType: string | null) {
  switch (deviceType) {
    case 'mobile':
      return <Smartphone className='h-4 w-4' />
    case 'tablet':
      return <Tablet className='h-4 w-4' />
    default:
      return <Monitor className='h-4 w-4' />
  }
}

interface SessionRow {
  id: string
  isCurrent: boolean
  deviceType: string | null
  deviceLabel: string
  browserOs: string
  ipAddress: string
  lastActivity: string
  createdAt: string
}

export function SessionsTab() {
  // Fetch sessions
  const { data, isLoading, error, refetch } = useQuery<{ sessions: RawSession[] }>({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const response = await api.get<{ sessions: RawSession[] }>('/user/sessions')
      return response.data
    },
  })

  // Revoke session mutation
  const { mutate: revokeSessionMutation, isPending: isRevoking } = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.post('/user/sessions/revoke', { sessionId })
    },
    onSuccess: () => {
      refetch()
      toast.success('Session revoked successfully')
    },
    onError: () => {
      toast.error('Failed to revoke session')
    },
  })

  // Revoke all sessions mutation
  const { mutate: revokeAllSessionsMutation, isPending: isRevokingAll } = useMutation({
    mutationFn: async () => {
      await api.post('/user/sessions/revoke-all')
    },
    onSuccess: () => {
      refetch()
      toast.success('All sessions revoked successfully')
    },
    onError: () => {
      toast.error('Failed to revoke all sessions')
    },
  })

  if (isLoading) {
    return (
      <LoadingCard
        title='Active Sessions'
        description='Manage your active sessions across different devices'
        itemCount={3}
      />
    )
  }

  if (error || !data?.sessions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions across different devices</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive'>
            <AlertDescription>Failed to load sessions. Please try again.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const sessions = data.sessions
  const rows: SessionRow[] = sessions.map((s) => ({
    id: s.id,
    isCurrent: Boolean(s.isCurrent),
    deviceType: s.deviceType ?? null,
    deviceLabel: s.deviceType || 'desktop',
    browserOs: `${s.browser || 'Unknown Browser'} on ${s.os || 'Unknown OS'}`,
    ipAddress: s.ipAddress || 'Unknown IP',
    lastActivity: s.lastActivity,
    createdAt: s.createdAt,
  }))
  const hasOtherSessions = rows.some((r) => !r.isCurrent)

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions across different devices
              </CardDescription>
            </div>
            {hasOtherSessions && (
              <BaseDialog
                title='Revoke All Sessions'
                description='This will log you out from all devices except this one. You will need to log in again on other devices.'
                trigger={
                  <Button
                    variant='destructive'
                    size='sm'
                    leftIcon={<LogOut />}
                    isLoading={isRevokingAll}
                    loadingText='Revoking…'>
                    Revoke All
                  </Button>
                }
                onPrimaryAction={() => revokeAllSessionsMutation()}
                primaryText='Revoke All'
                primaryVariant='destructive'
                isLoading={isRevokingAll}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                key: 'deviceLabel',
                header: 'Device',
                cell: (row: SessionRow) => (
                  <div className='flex items-center gap-3'>
                    <span className='text-muted-foreground'>{getDeviceIcon(row.deviceType)}</span>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <div className='font-medium truncate'>{row.browserOs}</div>
                        {row.isCurrent ? <Badge variant='default'>Current</Badge> : null}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {row.ipAddress} • {row.deviceType || 'desktop'}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'lastActivity',
                header: 'Last active',
                cell: (row: SessionRow) => (
                  <div className='text-sm text-muted-foreground'>
                    {timeAgo(row.lastActivity)}
                  </div>
                ),
              },
              {
                key: 'createdAt',
                header: 'Started',
                cell: (row: SessionRow) => (
                  <div className='text-sm text-muted-foreground'>
                    {dateTimeFormatter(row.createdAt, 'long')}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                cell: (row: SessionRow) =>
                  row.isCurrent ? (
                    <span className='text-xs text-muted-foreground'>—</span>
                  ) : (
                    <BaseDialog
                      title='Revoke Session'
                      description='Are you sure you want to revoke this session? The user will be logged out from this device.'
                      trigger={
                        <Button
                          variant='ghost'
                          size='icon'
                          disabled={isRevoking}
                          className='text-destructive hover:text-destructive'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      }
                      onPrimaryAction={() => revokeSessionMutation(row.id)}
                      primaryText='Revoke'
                      primaryVariant='destructive'
                      isLoading={isRevoking}
                    />
                  ),
              },
            ]}
            data={rows}
            searchable
            searchPlaceholder='Search sessions...'
            emptyMessage='No active sessions'
          />
        </CardContent>
      </Card>
    </div>
  )
}
