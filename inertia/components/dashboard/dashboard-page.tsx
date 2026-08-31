import { Head } from '@inertiajs/react'
import type { ReactNode } from 'react'

import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'

export interface DashboardPageProps {
  /** Used for <Head title={title} /> */
  title: string
  /** Optional description under the title */
  description?: ReactNode
  /** Back link href; when set, shows back button in header */
  backHref?: string
  /** Action buttons or links in the header */
  actions?: ReactNode
  /** Page content */
  children: ReactNode
  /** Optional class for the content wrapper */
  className?: string
}

/**
 * Dashboard page shell: Layout + Head + PageHeader + content div.
 * Use instead of repeating DashboardLayout, Head, PageHeader, and div.space-y-6 on every page.
 */
export function DashboardPage({
  title,
  description,
  backHref,
  actions,
  children,
  className,
}: DashboardPageProps) {
  return (
    <DashboardLayout>
      <Head title={title} />
      <div className={className ?? 'space-y-6'}>
        <PageHeader title={title} description={description} backHref={backHref} actions={actions} />
        {children}
      </div>
    </DashboardLayout>
  )
}
