import { IconLogout, IconTrash } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { RawSession } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { DataTable } from '@/components/dashboard/data-table'
import { DeviceIcon } from '@/components/settings/device-icon'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { BaseDialog } from '@/components/ui/base-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingCard } from '@/components/ui/loading'
import { dateTimeFormatter } from '@/lib/date'
import api from '@/lib/http'

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
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-sessions'],
    /**
     * Cast because the controller spreads `session.serialize()`, which Lucid types as
     * an opaque object — the rows lose their fields on the way out, so the wire shape
     * is restated here rather than inferred.
     */
    queryFn: async () => (await api.sessions.index({})) as { sessions: RawSession[] },
  })

  // Revoke session mutation
  const { mutate: revokeSessionMutation, isPending: isRevoking } = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.sessions.revoke({ body: { sessionId } })
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
      await api.sessions.revokeAll({})
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
      <AppCard
        title='Active Sessions'
        description='Manage your active sessions across different devices'>
        <Alert variant='destructive'>
          <AlertDescription>Failed to load sessions. Please try again.</AlertDescription>
        </Alert>
      </AppCard>
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
                    leftIcon={<IconLogout />}
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
                    <span className='text-muted-foreground'>
                      <DeviceIcon deviceType={row.deviceType} />
                    </span>
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
                  <div className='text-sm text-muted-foreground'>{timeAgo(row.lastActivity)}</div>
                ),
              },
              {
                key: 'createdAt',
                header: 'Started',
                cell: (row: SessionRow) => (
                  <div className='text-sm text-muted-foreground'>
                    {row?.createdAt ? dateTimeFormatter(row.createdAt, 'long') : '—'}
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
                          className='text-destructive hover:text-destructive'>
                          <IconTrash className='h-4 w-4' />
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
