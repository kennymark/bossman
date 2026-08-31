import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, Link, router } from '@inertiajs/react'
import { IconChevronRight, IconServer } from '@tabler/icons-react'
import { useState } from 'react'

import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { RefreshRailwayButton } from '@/components/servers/refresh-button'
import { EmptyState, LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Card } from '@/components/ui/card'

import { BuildLogsSheet } from './components/build-logs-sheet'
import { DeploymentsSheet } from './components/deployments-sheet'
import { RuntimeLogsSheet } from './components/runtime-logs-sheet'

interface RailwayService {
  id: string
  name: string
  icon: string | null
}

interface RailwayEnvironment {
  id: string
  name: string
}

interface RailwayProjectDetail {
  id: string
  name: string
  description: string | null
  services: RailwayService[]
  environments: RailwayEnvironment[]
}

interface ProjectShowProps extends SharedProps {
  projectName?: string | null
  project?: RailwayProjectDetail | null
}

export default function ServersProjectShow({ projectName, project }: ProjectShowProps) {
  const safeProject = project ?? null
  const displayName = safeProject?.name ?? projectName ?? 'Project'
  const [deploymentsSheetOpen, setDeploymentsSheetOpen] = useState(false)
  const [logsSheetOpen, setLogsSheetOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<{
    id: string
    name: string
    projectId: string
    environmentId: string
  } | null>(null)
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null)
  const [buildLogsSheetOpen, setBuildLogsSheetOpen] = useState(false)
  const [selectedBuildLogsDeploymentId, setSelectedBuildLogsDeploymentId] = useState<string | null>(
    null,
  )

  const openServiceDeployments = (service: RailwayService) => {
    if (!safeProject?.environments?.length) return
    const envId = safeProject.environments[0].id
    setSelectedService({
      id: service.id,
      name: service.name,
      projectId: safeProject.id,
      environmentId: envId,
    })
    setDeploymentsSheetOpen(true)
    setSelectedDeploymentId(null)
  }

  const openDeploymentLogs = (deploymentId: string) => {
    setSelectedDeploymentId(deploymentId)
    setLogsSheetOpen(true)
  }

  const openBuildLogs = (deploymentId: string) => {
    setSelectedBuildLogsDeploymentId(deploymentId)
    setBuildLogsSheetOpen(true)
  }

  return (
    <DashboardPage
      title={displayName}
      backHref='/servers'
      actions={
        /** The project detail is rendered server-side and cached, so this reloads it. */
        <RefreshRailwayButton
          onRefreshed={() => router.reload({ only: ['project', 'projectName'] })}
        />
      }>
      <Deferred data='project' fallback={<LoadingSkeleton type='list' />}>
        {safeProject === null ? (
          <EmptyState
            icon={IconServer}
            title={projectName ? `${projectName} not found` : 'Project not found'}
            description='This Railway project may not exist or you may not have access.'
            action={
              <Link href='/servers' className='text-primary hover:underline'>
                Back to Servers
              </Link>
            }
            className='rounded-lg border border-dashed border-border bg-muted/30'
          />
        ) : safeProject ? (
          <AppCard
            title='Services'
            description={`${safeProject.services.length} service${safeProject.services.length === 1 ? '' : 's'} in this project. Click a service to view deployments and logs.`}
            className='space-y-6'>
            {safeProject.services.length > 0 ? (
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {safeProject.services.map((service) => (
                  <Card
                    key={service.id}
                    className='group overflow-hidden border-border bg-card transition-colors hover:border-primary/25 hover:bg-muted/40'>
                    <button
                      type='button'
                      onClick={() => openServiceDeployments(service)}
                      className='flex w-full items-center gap-4 p-4 text-left'>
                      <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                        <IconServer className='h-5 w-5' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='font-semibold text-foreground'>{service.name}</p>
                        <p className='mt-0.5 text-xs text-muted-foreground'>
                          View deployments & logs
                        </p>
                      </div>
                      <IconChevronRight className='h-5 w-5 shrink-0 text-muted-foreground' />
                    </button>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={IconServer}
                title='No services'
                description='This project has no services yet.'
                className='rounded-lg border border-dashed border-border bg-muted/30'
              />
            )}
          </AppCard>
        ) : null}
      </Deferred>

      <DeploymentsSheet
        open={deploymentsSheetOpen}
        onOpenChange={setDeploymentsSheetOpen}
        selectedService={selectedService}
        onViewRuntimeLogs={openDeploymentLogs}
        onViewBuildLogs={openBuildLogs}
      />

      <RuntimeLogsSheet
        open={logsSheetOpen}
        onOpenChange={setLogsSheetOpen}
        deploymentId={selectedDeploymentId}
      />
      <BuildLogsSheet
        open={buildLogsSheetOpen}
        onOpenChange={setBuildLogsSheetOpen}
        deploymentId={selectedBuildLogsDeploymentId}
      />
    </DashboardPage>
  )
}
