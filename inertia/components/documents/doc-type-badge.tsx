import { IconShieldCheck } from '@tabler/icons-react'

import { startCase } from '#utils/functions'
import { Badge } from '@/components/ui/badge'

export function DocumentTypeBadge({ docType }: { docType: string | null | undefined }) {
  return <Badge variant='secondary'>{docType ? startCase(docType) : 'Other'}</Badge>
}

export function ComplianceBadge({ isCompliance }: { isCompliance: boolean | null | undefined }) {
  if (!isCompliance) return <span className='text-muted-foreground'>—</span>
  return (
    <Badge variant='indigo' className='gap-1'>
      <IconShieldCheck className='h-3 w-3' />
      Compliance
    </Badge>
  )
}
