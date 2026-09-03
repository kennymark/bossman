import type { SharedProps } from '@adonisjs/inertia/types'
import { Link } from '@inertiajs/react'
import { IconPencil } from '@tabler/icons-react'

import type { RawLease } from '#types/model-types'
import { formatCurrency } from '#utils/currency'
import { startCase } from '#utils/functions'
import { leaseEndLabel } from '#utils/lease_period'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import DetailRow from '@/components/dashboard/detail-row'
import { type QuickActionOption, QuickActions } from '@/components/dashboard/quick-actions'
import { LeaseStatusBadge } from '@/components/leases/status-badge'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { dateFormatter } from '@/lib/date'

import { ActivityTab } from './components/activity-tab'
import { PaymentsTab } from './components/payments-tab'

interface LeaseShowProps extends SharedProps {
  lease: RawLease
}

export default function LeaseShow({ lease }: LeaseShowProps) {
  const { query, updateQuery } = useInertiaParams()
  const currentTab = query.tab ? query.tab : 'details'

  const handleTabChange = (value: string) => {
    updateQuery({ tab: value })
  }

  const quickActions: QuickActionOption[] = [
    {
      title: 'Edit lease',
      description: 'Open the lease edit page to change details.',
      icon: IconPencil,
      dontShowIf: false,
      href: `/leases/${lease.id}/edit`,
    },
  ]

  return (
    <DashboardPage
      title='Lease details'
      description={lease.cleanName}
      backHref='/leases'
      actions={
        <div className='flex flex-wrap items-center gap-2'>
          <QuickActions options={quickActions} className='flex items-center gap-1' />
          <Button variant='outline' size='md' asChild>
            <Link>View Contract</Link>
          </Button>
        </div>
      }>
      <Tabs value={currentTab} onValueChange={handleTabChange} className='space-y-6'>
        <TabsList>
          <TabsTrigger value='details'>Details</TabsTrigger>
          <TabsTrigger value='payments'>Payments</TabsTrigger>
          <TabsTrigger value='activity'>Activity</TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='space-y-6'>
          <AppCard title='Lease information' description='Details and identifiers'>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              <DetailRow label='Status' value={<LeaseStatusBadge status={lease.status} />} />
              <DetailRow label='Rent' value={formatCurrency(lease.rentAmount, lease.currency)} />

              <DetailRow label='eLease' value={lease.isELease ? 'Yes' : 'No'} />
              <DetailRow label='Frequency' value={startCase(lease.frequency)} />
              <DetailRow label='Remaining duration' value={lease.remainingDuration} />

              <DetailRow
                label='Start date'
                value={lease.startDate ? dateFormatter(lease.startDate) : null}
              />
              <DetailRow label='End date' value={leaseEndLabel(lease, dateFormatter)} />
              <DetailRow
                label='Deposit'
                value={formatCurrency(lease.depositAmount, lease.currency)}
              />
              <DetailRow label='Tenant' value={lease.tenantName} />
              <DetailRow
                label='Property'
                value={
                  <Link
                    href={`/properties/${lease.leaseableEntityId}`}
                    className='font-medium hover:underline'>
                    {lease.propertyAddress}
                  </Link>
                }
              />
            </div>
          </AppCard>
        </TabsContent>

        <TabsContent value='payments' className='space-y-6'>
          <PaymentsTab leaseId={lease.id} />
        </TabsContent>

        <TabsContent value='activity' className='space-y-6'>
          <ActivityTab leaseId={lease.id} />
        </TabsContent>
      </Tabs>
    </DashboardPage>
  )
}
