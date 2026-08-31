import type { SharedProps } from '@adonisjs/inertia/types'
import { Link } from '@inertiajs/react'
import { IconPackage, IconPlus } from '@tabler/icons-react'

import type { AddonRow } from '@/components/addons/addon-card'
import { AddonCard } from '@/components/addons/addon-card'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { EmptyState } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'

interface AddonsIndexProps extends SharedProps {
  addons: AddonRow[]
}

export default function AddonsIndex({ addons }: AddonsIndexProps) {
  return (
    <DashboardPage
      title='Addons'
      description='Create and manage addons. Each addon can have a price and billing type configured.'
      actions={
        <Button asChild leftIcon={<IconPlus className='h-4 w-4' />}>
          <Link href='/addons/create'>New addon</Link>
        </Button>
      }>
      {addons.length === 0 ? (
        <EmptyState
          icon={IconPackage}
          title='No addons'
          description='Create your first addon using the button above. You can set the price on the create page.'
          className='rounded-lg border border-dashed border-border bg-muted/30'
        />
      ) : (
        <AppCard
          title='Addons'
          description={`${addons.length} addon${addons.length === 1 ? '' : 's'}`}>
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {addons.map((addon) => (
              <AddonCard key={addon.id} addon={addon} />
            ))}
          </div>
        </AppCard>
      )}
    </DashboardPage>
  )
}
