import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, Link, router } from '@inertiajs/react'
import { IconBuilding, IconFileText, IconStack } from '@tabler/icons-react'
import { useMemo } from 'react'

import type { RawActivity, RawMaintenanceRequest } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { formatNumber, startCase } from '#utils/functions'
import { activityTabColumns } from '@/components/dashboard/activity-columns'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import DetailRow from '@/components/dashboard/detail-row'
import {
  leaseDisplayName,
  MaintenanceDueDate,
  MaintenanceSeverityBadge,
  MaintenanceStatusBadge,
} from '@/components/maintenance'
import { Badge, LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { type PageCommand, useRegisterPageCommands } from '@/contexts/page-commands'
import { dateFormatter } from '@/lib/date'

interface ActivityRow {
  id: string
  type: string
  summary: string
  isSystemAction: boolean
  createdAt: string | null
  user: { id: string; name: string } | null
}

interface MaintenanceShowProps extends SharedProps {
  maintenanceRequest: RawMaintenanceRequest
  /** Deferred: the product's activity rows that reference this request. */
  activities?: ActivityRow[]
}

function propertyLabel(request: RawMaintenanceRequest): string | null {
  if (request.leaseableEntity?.address) return request.leaseableEntity.address
  if (request.property) {
    return [request.property.addressLineOne, request.property.city, request.property.postCode]
      .filter(Boolean)
      .join(', ')
  }
  return null
}

export default function MaintenanceShow({ maintenanceRequest, activities }: MaintenanceShowProps) {
  const request = maintenanceRequest
  const property = propertyLabel(request)
  const propertyHref = request.leaseableEntityId
    ? `/properties/${request.leaseableEntityId}`
    : request.property?.leaseableEntityId
      ? `/properties/${request.property.leaseableEntityId}`
      : null

  const availableDays = Array.isArray(request.availableDays) ? request.availableDays : []

  const pageCommands = useMemo(() => {
    const commands: PageCommand[] = []
    const orgId = request.org?.id ?? request.orgId
    if (orgId) {
      commands.push({
        id: 'view-org',
        label: 'Open customer',
        description: 'Go to the linked organisation.',
        keywords: 'org organisation customer',
        icon: <IconBuilding className='mr-2 h-4 w-4' />,
        onSelect: () => router.visit(`/orgs/${orgId}`),
      })
    }
    if (request.leaseId) {
      commands.push({
        id: 'view-lease',
        label: 'Open lease',
        description: leaseDisplayName(request.lease) ?? 'Go to the linked lease.',
        icon: <IconFileText className='mr-2 h-4 w-4' />,
        onSelect: () => router.visit(`/leases/${request.leaseId}`),
      })
    }
    if (propertyHref) {
      commands.push({
        id: 'view-property',
        label: 'Open property',
        description: property ?? 'Go to the linked property.',
        icon: <IconStack className='mr-2 h-4 w-4' />,
        onSelect: () => router.visit(propertyHref),
      })
    }
    return commands
  }, [request, property, propertyHref])

  useRegisterPageCommands(pageCommands, 'maintenance-detail')

  return (
    <DashboardPage
      title='Maintenance request'
      description={request.title}
      backHref='/maintenance'
      actions={
        <div className='flex items-center gap-2'>
          <MaintenanceSeverityBadge severity={request.severity} />
          <MaintenanceStatusBadge status={request.status} />
        </div>
      }>
      <AppCard title='Request' description='Status, timing and cost'>
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          <DetailRow label='Status' value={<MaintenanceStatusBadge status={request.status} />} />
          <DetailRow
            label='Severity'
            value={<MaintenanceSeverityBadge severity={request.severity} />}
          />
          <DetailRow label='Type' value={request.type ? startCase(request.type) : null} />
          <DetailRow
            label='Reported by'
            value={request.reportedBy ? startCase(request.reportedBy) : null}
          />
          <DetailRow label='Due date' value={<MaintenanceDueDate row={request} />} />
          <DetailRow
            label='Completion date'
            value={request.completionDate ? dateFormatter(request.completionDate) : null}
          />
          <DetailRow
            label='Agreed repair date'
            value={request.agreedRepairDate ? dateFormatter(request.agreedRepairDate) : null}
          />
          <DetailRow
            label='Cost'
            value={
              request.cost !== null && request.cost !== undefined
                ? formatNumber(request.cost)
                : null
            }
          />
          <DetailRow label='Private' value={request.isPrivate ? 'Yes' : 'No'} />
          <DetailRow
            label='Created'
            value={
              request.createdAt
                ? `${dateFormatter(request.createdAt, 'basicWithTime')} (${timeAgo(request.createdAt)})`
                : null
            }
          />
          <DetailRow
            label='Updated'
            value={request.updatedAt ? timeAgo(request.updatedAt) : null}
          />
          {request.archivedAt && (
            <DetailRow
              label='Archived'
              value={<Badge variant='outline'>{timeAgo(request.archivedAt)}</Badge>}
            />
          )}
          <DetailRow label='ID' value={<span className='font-mono text-xs'>{request.id}</span>} />
        </div>
      </AppCard>

      <div className='grid gap-6 lg:grid-cols-2'>
        <AppCard title='Description' description='As entered by the reporter'>
          {request.description ? (
            <p className='whitespace-pre-wrap text-sm'>{request.description}</p>
          ) : (
            <p className='text-sm text-muted-foreground'>No description.</p>
          )}
        </AppCard>

        <AppCard title='Availability' description='When the tenant can give access'>
          <div className='grid gap-6 sm:grid-cols-2'>
            <DetailRow
              label='Days'
              value={
                availableDays.length ? (
                  <div className='flex flex-wrap gap-1'>
                    {availableDays.map((day) => (
                      <Badge key={String(day)} variant='outline'>
                        {startCase(String(day))}
                      </Badge>
                    ))}
                  </div>
                ) : null
              }
            />
            <DetailRow label='Time' value={request.availableTime || null} />
          </div>
        </AppCard>
      </div>

      <AppCard title='Linked records' description='Organisation, tenant, lease and property'>
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          <DetailRow
            label='Organisation'
            value={
              request.org ? (
                <Link href={`/orgs/${request.org.id}`} className='hover:underline'>
                  {request.org.cleanName ?? request.org.name}
                </Link>
              ) : request.orgId ? (
                <Link href={`/orgs/${request.orgId}`} className='hover:underline'>
                  {request.orgId}
                </Link>
              ) : null
            }
          />
          <DetailRow
            label='Tenant'
            value={
              request.tenant ? (
                <div className='space-y-0.5'>
                  <div>{request.tenant.name}</div>
                  {request.tenant.email && (
                    <div className='text-xs text-muted-foreground'>{request.tenant.email}</div>
                  )}
                </div>
              ) : null
            }
          />
          <DetailRow
            label='Lease'
            value={
              request.leaseId ? (
                <Link href={`/leases/${request.leaseId}`} className='hover:underline'>
                  {leaseDisplayName(request.lease) ?? request.leaseId}
                </Link>
              ) : null
            }
          />
          <DetailRow
            label='Property'
            value={
              propertyHref ? (
                <Link href={propertyHref} className='hover:underline'>
                  {property ?? 'View property'}
                </Link>
              ) : (
                property
              )
            }
          />
        </div>
      </AppCard>

      <Deferred data='activities' fallback={<LoadingSkeleton type='table' />}>
        <AppCard
          title='Activity'
          description='Most recent 50 product activity entries for this request'>
          <DataTable
            columns={activityTabColumns}
            data={(activities ?? []) as unknown as RawActivity[]}
            emptyMessage='No activity recorded for this request.'
          />
        </AppCard>
      </Deferred>
    </DashboardPage>
  )
}
