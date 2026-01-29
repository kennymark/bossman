import { Link } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Clock, FileEdit, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { timeAgo } from '@/lib/date'
import api from '@/lib/http'

interface AuditLog {
  id: number
  event: string
  auditable_type: string
  auditable_id: number
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const eventIcons: Record<string, React.ReactNode> = {
  created: <Plus className='h-4 w-4' />,
  updated: <FileEdit className='h-4 w-4' />,
  deleted: <Trash2 className='h-4 w-4' />,
}

const eventColors: Record<string, string> = {
  created: 'bg-green-500/10 text-green-500',
  updated: 'bg-blue-500/10 text-blue-500',
  deleted: 'bg-red-500/10 text-red-500',
}

function getEventLabel(event: string, auditableType: string): string {
  const typeLabel = auditableType.replace('App/Models/', '').toLowerCase()
  return `${event} ${typeLabel}`
}


export function ActivityLogs() {
  const { data, isLoading, error } = useQuery<{ audits: AuditLog[] }>({
    queryKey: ['recent-audits'],
    queryFn: async () => {
      const response = await api.get('/audits/recent')
      return response.data as { audits: AuditLog[] }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })


  if (isLoading) {
    return (
      <Card className='col-span-3'>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Loading variant='skeleton' type='list' count={5} />
        </CardContent>
      </Card>
    )
  }

  if (error || !data?.audits || data.audits.length === 0) {
    return (
      <Card className='col-span-3'>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Activity className='h-12 w-12 text-muted-foreground mb-4 opacity-50' />
            <p className='text-sm text-muted-foreground'>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='col-span-3'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent account activity and changes</CardDescription>
          </div>
          <Link href='/settings?tab=activity'>
            <Badge variant='outline' className='cursor-pointer hover:bg-accent'>
              View All
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {data.audits.map((audit) => (
            <div key={audit.id} className='flex items-start gap-3'>
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full ${eventColors[audit.event] || 'bg-gray-500/10 text-gray-500'
                  }`}>
                {eventIcons[audit.event] || <Activity className='h-4 w-4' />}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <p className='text-sm font-medium'>
                    {getEventLabel(audit.event, audit.auditable_type)}
                  </p>
                  <Badge variant='outline' className='text-xs'>
                    {audit.auditable_type.replace('App/Models/', '')}
                  </Badge>
                </div>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Clock className='h-3 w-3' />
                  <span>{timeAgo(audit.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
