import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link, router, usePage } from '@inertiajs/react'
import type { RawLeaseableEntity } from '#types/model-types'
import DetailRow from '@/components/dashboard/detail-row'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityTab } from './components/activity-tab'
import { LeasesTab } from './components/leases-tab'

const validTabs = ['details', 'leases', 'activity'] as const
type LeaseableEntityTabValue = (typeof validTabs)[number]

interface PropertyShowProps extends SharedProps {
  property: RawLeaseableEntity
}

export default function PropertyShow({ property }: PropertyShowProps) {
  const page = usePage()
  const qs = (page.props.qs as { tab?: string }) || {}
  const currentTab = (
    qs.tab && validTabs.includes(qs.tab as LeaseableEntityTabValue) ? qs.tab : 'details'
  ) as LeaseableEntityTabValue

  const handleTabChange = (value: string) => {
    if (validTabs.includes(value as LeaseableEntityTabValue)) {
      router.get(
        `/properties/${property.id}`,
        { tab: value },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
        },
      )
    }
  }

  return (
    <DashboardLayout>
      <Head title={`Property: ${property.address}`} />
      <div className='space-y-6'>
        <PageHeader
          title={property.address}
          backHref='/properties'
          description={`${property.type}${property.subType ? ` · ${property.subType}` : ''}`}
          actions={
            <Button variant='outline' asChild>
              <Link href='/properties'>Back to properties</Link>
            </Button>
          }
        />

        <Tabs value={currentTab} onValueChange={handleTabChange} className='space-y-6'>
          <TabsList>
            <TabsTrigger value='details'>Details</TabsTrigger>
            <TabsTrigger value='leases'>Leases</TabsTrigger>
            <TabsTrigger value='activity'>Activity</TabsTrigger>
          </TabsList>

          <TabsContent value='details' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Leaseable entity information</CardTitle>
                <CardDescription>Details and identifiers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                  <DetailRow label='Type' value={property.type} />
                  {property.subType && property.subType !== '—' && (
                    <DetailRow label='Sub type' value={property.subType} />
                  )}
                  <DetailRow label='Bedrooms' value={property.bedrooms ?? null} />
                  <DetailRow label='Bathrooms' value={property.bathrooms ?? null} />
                  <DetailRow label='Service Type' value={property.isLetOnly ? 'Let Only' : 'Fully Managed'} />
                  <DetailRow
                    label='Status'
                    value={
                      <Badge variant={property.isVacant ? 'secondary' : 'default'}>
                        {property.isVacant ? 'Vacant' : 'Occupied'}
                      </Badge>
                    }
                  />


                </div>
              </CardContent>
            </Card>
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
