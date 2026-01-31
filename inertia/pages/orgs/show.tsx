import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link } from '@inertiajs/react'
import { Pause } from 'lucide-react'
import type { RawOrg } from '#types/model-types'
import DetailRow from '@/components/dashboard/detail-row'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { type QuickActionOption, QuickActions } from '@/components/dashboard/quick-actions'
import { OnlyShowIf, SimpleGrid } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { ActivitiesTab } from './components/activities-tab'
import { LeasesTab } from './components/leases-tab'
import { PropertiesTab } from './components/properties-tab'

const validTabs = ['details', 'leases', 'properties', 'activities'] as const
type OrgTabValue = (typeof validTabs)[number]

interface OrgShowProps extends SharedProps {
  org: RawOrg
}

export default function OrgShow({ org }: OrgShowProps) {
  const { query, updateQuery } = useInertiaParams()
  const qs = query as { tab?: string }
  const currentTab =
    qs.tab && validTabs.includes(qs.tab as OrgTabValue) ? qs.tab : ('details' as OrgTabValue)

  const id = String(org.id ?? '')
  const cleanName = String(org.cleanName ?? org.companyName ?? org.name ?? 'Organisation')
  const ownerRole = String(org.ownerRole ?? '—')
  const country = String(org.country ?? '—')
  const hasActiveSubscription = Boolean(org.hasActiveSubscription)

  const handleTabChange = (value: string) => {
    if (validTabs.includes(value as OrgTabValue)) {
      updateQuery({ tab: value })
    }
  }

  const quickActions: QuickActionOption[] = [
    {
      title: 'Pause account',
      description: "Pause the org's account.",
      icon: Pause,
      onClick: () => {
        console.log('Pause account')
      },
    },
  ]

  return (
    <DashboardLayout>
      <Head title={`Org: ${cleanName}`} />
      <div className='space-y-6'>
        <PageHeader
          title={cleanName}
          backHref='/orgs'
          description={org.companyName ? String(org.companyName) : undefined}
          actions={<QuickActions options={quickActions} />}
        />

        <Tabs value={currentTab} onValueChange={handleTabChange} className='space-y-6'>
          <TabsList>
            <TabsTrigger value='details'>Details</TabsTrigger>
            <TabsTrigger value='leases'>Leases</TabsTrigger>
            <TabsTrigger value='properties'>Properties</TabsTrigger>
            <TabsTrigger value='activities'>Activities</TabsTrigger>
          </TabsList>

          <TabsContent value='details' className='space-y-6'>
            <AppCard
              title='User information'
              description='Details and identifiers'
              className='space-y-6'>
              <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                <DetailRow
                  label='Owner type'
                  value={
                    <Badge variant='outline' className='w-fit capitalize'>
                      {ownerRole}
                    </Badge>
                  }
                />
                <DetailRow label='Country' value={country} />
                <DetailRow
                  label='Subscription'
                  value={
                    <Badge variant={hasActiveSubscription ? 'default' : 'secondary'}>
                      {hasActiveSubscription ? 'Active' : 'Inactive'}
                    </Badge>
                  }
                />

                <DetailRow label='Creator email' value={String(org.creatorEmail)} />
                <DetailRow label='Custom Plan' value={org.isOnCustomPlan ? 'Yes' : 'No'} />
              </div>
            </AppCard>

            <OnlyShowIf condition={org.isOnCustomPlan}>
              <AppCard title='Custom Plan' description='Custom plan features'>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
                  <DetailRow
                    label='Tenant limit'
                    value={org.customPlanFeatures?.tenantLimit ?? '—'}
                  />
                  <DetailRow
                    label='Team member limit'
                    value={org.customPlanFeatures?.teamMemberLimit ?? '—'}
                  />
                  <DetailRow
                    label='Storage limit'
                    value={org.customPlanFeatures?.storageLimit ?? '—'}
                  />
                  <DetailRow
                    label='Property limit'
                    value={org.customPlanFeatures?.propertyLimit ?? '—'}
                  />
                  <DetailRow
                    label='Activity log retention'
                    value={org.customPlanFeatures?.activityLogRetention ?? '—'}
                  />
                  <DetailRow
                    label='Deposit protection'
                    value={org.customPlanFeatures?.depositProtection ?? '—'}
                  />
                  <DetailRow
                    label='Advanced reporting'
                    value={org.customPlanFeatures?.advancedReporting ?? '—'}
                  />
                  <DetailRow
                    label='E-sign docs limit'
                    value={org.customPlanFeatures?.eSignDocsLimit ?? '—'}
                  />
                  <DetailRow
                    label='AI invocation limit'
                    value={org.customPlanFeatures?.aiInvocationLimit ?? '—'}
                  />
                  <DetailRow
                    label='Custom templates limit'
                    value={org.customPlanFeatures?.customTemplatesLimit ?? '—'}
                  />
                </SimpleGrid>
              </AppCard>
            </OnlyShowIf>

            <AppCard
              title='Settings'
              description="Configure the org's settings."
              className='space-y-6'>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
                <DetailRow
                  label='Preferred currency'
                  value={org.settings?.preferredCurrency ?? '—'}
                />
                <DetailRow
                  label='Preferred timezone'
                  value={org.settings?.preferredTimezone ?? '—'}
                />
                <DetailRow
                  label='Preferred date format'
                  value={org.settings?.preferredDateFormat ?? '—'}
                />
                <DetailRow
                  label='Weekly digest'
                  value={org.settings?.weeklyDigest ? 'Yes' : 'No'}
                />
                <DetailRow
                  label='Monthly digest'
                  value={org.settings?.monthlyDigest ? 'Yes' : 'No'}
                />
                <DetailRow
                  label='Auto archive leases'
                  value={org.settings?.autoArchiveLeases ? 'Yes' : 'No'}
                />
                <DetailRow
                  label='Enable payments'
                  value={org.settings?.enablePayments ? 'Yes' : 'No'}
                />
                <DetailRow
                  label='Notifications'
                  value={org.settings?.notifications ? 'Yes' : 'No'}
                />
              </SimpleGrid>
            </AppCard>
          </TabsContent>

          <TabsContent value='leases' className='space-y-6'>
            <LeasesTab orgId={id} />
          </TabsContent>

          <TabsContent value='properties' className='space-y-6'>
            <PropertiesTab orgId={id} />
          </TabsContent>

          <TabsContent value='activities' className='space-y-6'>
            <ActivitiesTab orgId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
