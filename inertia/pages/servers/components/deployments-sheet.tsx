import {
  IconChevronDown,
  IconLoader2,
  IconRefresh,
  IconRocket,
  IconRotate2,
  IconTerminal2,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { timeAgo } from '#utils/date'
import { Badge } from '@/components/ui/badge'
import { BaseSheet } from '@/components/ui/base-sheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface RailwayDeploymentMeta {
  commitMessage?: string
  [key: string]: unknown
}

interface RailwayDeployment {
  id: string
  status: string
  createdAt: string
  meta: string | RailwayDeploymentMeta | null
  canRedeploy: boolean
  canRollback: boolean
}

function deploymentTitle(d: RailwayDeployment): string {
  const m = d.meta
  if (typeof m === 'string' && m) return m
  if (m && typeof m === 'object' && typeof m.commitMessage === 'string') return m.commitMessage
  return `Deployment ${timeAgo(d.createdAt)}`
}

function statusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'SUCCESS':
      return 'default'
    case 'BUILDING':
    case 'DEPLOYING':
    case 'NEEDS_APPROVAL':
    case 'QUEUED':
      return 'secondary'
    case 'FAILED':
    case 'CRASHED':
      return 'destructive'
    default:
      return 'outline'
  }
}

export interface SelectedService {
  id: string
  name: string
  projectId: string
  environmentId: string
}

interface DeploymentsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedService: SelectedService | null
  onViewRuntimeLogs: (deploymentId: string) => void
  onViewBuildLogs: (deploymentId: string) => void
}

export function DeploymentsSheet({
  open,
  onOpenChange,
  selectedService,
  onViewRuntimeLogs,
  onViewBuildLogs,
}: DeploymentsSheetProps) {
  const queryClient = useQueryClient()

  const { data: deployments = [], isLoading: deploymentsLoading } = useQuery({
    queryKey: ['railway', 'deployments', selectedService?.id, selectedService?.environmentId],
    queryFn: async () => {
      if (!selectedService) return []
      const res = await api.railway.deployments({
        params: { serviceId: selectedService.id },
        query: {
          environmentId: selectedService.environmentId,
          projectId: selectedService.projectId,
        },
      })
      return res ?? []
    },
    enabled: !!selectedService && open,
  })

  const restartMutation = useMutation({
    mutationFn: (deploymentId: string) =>
      api.railway.deploymentRestart({ params: { id: deploymentId } }),
    onSuccess: () => {
      toast.success('Restart triggered.')
      if (selectedService) {
        queryClient.invalidateQueries({
          queryKey: ['railway', 'deployments', selectedService.id, selectedService.environmentId],
        })
      }
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to restart.')
    },
  })

  const redeployMutation = useMutation({
    mutationFn: (deploymentId: string) =>
      api.railway.deploymentRedeploy({ params: { id: deploymentId } }),
    onSuccess: () => {
      toast.success('Redeploy triggered.')
      if (selectedService) {
        queryClient.invalidateQueries({
          queryKey: ['railway', 'deployments', selectedService.id, selectedService.environmentId],
        })
      }
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to redeploy.')
    },
  })

  const deployMutation = useMutation({
    mutationFn: () => {
      if (!selectedService) throw new Error('No service selected')
      return api.railway.serviceDeploy({
        params: { serviceId: selectedService.id },
        body: { environmentId: selectedService.environmentId },
      })
    },
    onSuccess: () => {
      toast.success('Deploy triggered.')
      if (selectedService) {
        queryClient.invalidateQueries({
          queryKey: ['railway', 'deployments', selectedService.id, selectedService.environmentId],
        })
      }
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to deploy.')
    },
  })

  return (
    <BaseSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`${selectedService?.name ?? 'Service'} — Deployments`}
      description='Last 5 deployments. Open logs or use Restart / Redeploy.'
      side='right'
      className='w-full sm:max-w-xl'>
      {deploymentsLoading ? (
        <div className='flex min-h-[200px] items-center justify-center py-12'>
          <IconLoader2 className='h-10 w-10 animate-spin text-primary' />
        </div>
      ) : deployments.length > 0 ? (
        <div className='min-h-0 overflow-hidden'>
          <div className='space-y-3 pr-2'>
            {deployments.map((d, index) => (
              <Card
                key={d.id}
                className='overflow-hidden border-border bg-card transition-colors hover:border-primary/25'>
                <div
                  className={`border-l-4 ${
                    d.status === 'SUCCESS'
                      ? 'border-l-green-500'
                      : d.status === 'FAILED' || d.status === 'CRASHED'
                        ? 'border-l-destructive'
                        : 'border-l-amber-500'
                  }`}>
                  <div className='flex flex-col gap-3 p-4'>
                    <p
                      className='truncate text-sm font-medium text-foreground'
                      title={deploymentTitle(d)}>
                      {deploymentTitle(d)}
                    </p>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <div className='flex min-w-0 flex-wrap items-center gap-2'>
                        <Badge variant={statusColor(d.status)} className='shrink-0 capitalize'>
                          {d.status.toLowerCase()}
                        </Badge>
                        {index === 0 && (
                          <Badge variant='secondary' className='shrink-0'>
                            Latest
                          </Badge>
                        )}
                        <span className='text-xs text-muted-foreground'>
                          {timeAgo(d.createdAt)}
                        </span>
                      </div>
                      {index === 0 && (
                        <div className='flex shrink-0 items-center gap-2'>
                          {d.status === 'NEEDS_APPROVAL' && (
                            <Button
                              variant='default'
                              size='xs'
                              leftIcon={<IconRocket className='h-3.5 w-3.5' />}
                              onClick={() => deployMutation.mutate()}
                              disabled={deployMutation.isPending}
                              isLoading={deployMutation.isPending}
                              loadingText='Deploying…'>
                              Deploy service
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='outline' size='xs'>
                                Actions
                                <IconChevronDown className='h-3.5 w-3.5' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => restartMutation.mutate(d.id)}
                                disabled={restartMutation.isPending}>
                                <IconRotate2 className='mr-2 h-4 w-4' />
                                Restart
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => redeployMutation.mutate(d.id)}
                                disabled={redeployMutation.isPending || !d.canRedeploy}>
                                <IconRefresh className='mr-2 h-4 w-4' />
                                Redeploy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                    {(d.status === 'QUEUED' || d.status === 'BUILDING') && (
                      <Button
                        variant='secondary'
                        size='sm'
                        className='w-full justify-start gap-2 bg-muted/60'
                        onClick={() => onViewBuildLogs(d.id)}>
                        <IconTerminal2 className='h-4 w-4 shrink-0' />
                        View build logs
                      </Button>
                    )}
                    <Button
                      variant='secondary'
                      size='sm'
                      className='w-full justify-start gap-2 bg-muted/60'
                      onClick={() => onViewRuntimeLogs(d.id)}>
                      <IconTerminal2 className='h-4 w-4 shrink-0' />
                      View runtime logs
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={IconRefresh}
          title='No deployments'
          description='No deployments for this service yet.'
          className='min-h-[200px] py-12'
        />
      )}
    </BaseSheet>
  )
}
