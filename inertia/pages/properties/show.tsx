import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link, router, usePage } from '@inertiajs/react'
import type { RawLeaseableEntity } from '#types/model-types'
import { startCase } from '#utils/functions'
import DetailRow from '@/components/dashboard/detail-row'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { ActivityTab } from './components/activity-tab'
import { LeasesTab } from './components/leases-tab'

const validTabs = ['details', 'leases', 'activity'] as const


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

  return (
    <DashboardLayout>
      <Head title={`Property: ${property.address}`} />
      <div className='space-y-6'>
        <PageHeader
          title={property.address}
          backHref='/properties'
          description={`${startCase(property.type)} - ${startCase(property.subType) ?? ''}`}

        />

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
      </div>
    </DashboardLayout>
  )
}
