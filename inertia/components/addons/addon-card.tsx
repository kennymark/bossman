import { IconPackage } from '@tabler/icons-react'

import { ResourceCard } from '@/components/dashboard/resource-card'
import { Badge } from '@/components/ui/badge'

import { BILLING_LABELS, type AddonBillingType } from './constants'

export interface AddonRow {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  billingType: AddonBillingType
  priceAmount: string | null
  priceCurrency: string | null
  isActive: boolean
  sortOrder: number
}

export interface AddonCardProps {
  addon: AddonRow
}

export function AddonCard({ addon }: AddonCardProps) {
  return (
    <ResourceCard
      href={`/addons/${addon.id}/edit`}
      icon={IconPackage}
      title={addon.name}
      subtitle={`/${addon.slug}`}
      description={
        addon.shortDescription ? (
          <span className='line-clamp-2'>{addon.shortDescription}</span>
        ) : (
          <span className='italic'>No description</span>
        )
      }
      footer={
        <>
          <Badge variant='outline' className='text-xs'>
            {BILLING_LABELS[addon.billingType]}
          </Badge>
          {addon.isActive ? (
            <Badge variant='success' className='text-xs'>
              Active
            </Badge>
          ) : (
            <Badge variant='secondary' className='text-xs'>
              Inactive
            </Badge>
          )}
          {addon.priceAmount != null && addon.priceCurrency ? (
            <span className='ml-auto text-sm font-medium tabular-nums'>
              {addon.priceCurrency} {addon.priceAmount}
            </span>
          ) : (
            <span className='ml-auto text-xs text-muted-foreground'>No price</span>
          )}
        </>
      }
    />
  )
}
