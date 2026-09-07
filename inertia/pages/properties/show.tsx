import type { SharedProps } from '@adonisjs/inertia/types'
import { router } from '@inertiajs/react'
import { IconBuilding } from '@tabler/icons-react'
import { useMemo } from 'react'

import type { RawLeaseableEntity } from '#types/model-types'
import { startCase } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import DetailRow from '@/components/dashboard/detail-row'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type PageCommand, useRegisterPageCommands } from '@/contexts/page-commands'
import { useInertiaParams } from '@/hooks/use-inertia-params'

import { ActivityTab } from './components/activity-tab'
import { LeasesTab } from './components/leases-tab'

interface PropertyShowProps extends SharedProps {
  property: RawLeaseableEntity
}

export default function PropertyShow({ property }: PropertyShowProps) {
  const { query, updateQuery } = useInertiaParams()
  const qs = query as { tab?: string }
  const currentTab = qs.tab ?? 'details'

  const handleTabChange = (value: string) => {
    updateQuery({ tab: value })
  }

  const pageCommands = useMemo<PageCommand[]>(() => {
    if (!property.orgId) return []
    return [
      {
        id: 'view-org',
        label: 'Open customer',
        description: 'Go to the organisation that owns this property.',
        keywords: 'org organisation customer',
        icon: <IconBuilding className='mr-2 h-4 w-4' />,
        onSelect: () => router.visit(`/orgs/${property.orgId}`),
      },
    ]
  }, [property.orgId])

  useRegisterPageCommands(pageCommands, 'property-detail')

  return (
    <DashboardPage
      title={property.address}
      description={`${startCase(property.type)} - ${startCase(property.subType) ?? ''}`}
      backHref='/properties'>
      <Tabs value={currentTab} onValueChange={handleTabChange} className='space-y-6'>
        <TabsList>
          <TabsTrigger value='details'>Details</TabsTrigger>
          <TabsTrigger value='leases'>Leases</TabsTrigger>
          <TabsTrigger value='activity'>Activity</TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='space-y-6'>
          <AppCard title='Property details' description='Details and identifiers'>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              <DetailRow label='Type' value={startCase(property.type)} />
              <DetailRow label='Sub type' value={startCase(property.subType)} />

              <DetailRow label='Bedrooms' value={property.bedrooms ?? null} />
              <DetailRow label='Bathrooms' value={property.bathrooms ?? null} />
              <DetailRow
                label='Service Type'
                value={property.isLetOnly ? 'Let Only' : 'Fully Managed'}
              />
              <DetailRow
                label='Status'
                value={
                  <Badge variant={property.isVacant ? 'secondary' : 'default'}>
                    {property.isVacant ? 'Vacant' : 'Occupied'}
                  </Badge>
                }
              />
            </div>
          </AppCard>
        </TabsContent>

        <TabsContent value='leases' className='space-y-6'>
          <LeasesTab propertyId={property.id} />
        </TabsContent>

        <TabsContent value='activity' className='space-y-6'>
          <ActivityTab propertyId={property.id} />
        </TabsContent>
      </Tabs>
    </DashboardPage>
  )
}
