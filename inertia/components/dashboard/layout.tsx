import { Sidebar } from '@/components/dashboard/sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode | (() => React.ReactNode)
  isLoading?: boolean
  entityNotFound?: boolean
  notFoundTitle?: string
  notFoundMsg?: React.ReactNode
}

export function DashboardLayout({
  children,
  isLoading,
  entityNotFound,
  notFoundTitle = 'Not found',
  notFoundMsg,
}: DashboardLayoutProps) {
  return (
    <Sidebar>
      {isLoading ? (
        <div className='flex items-center justify-center h-64'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </div>
      ) : entityNotFound ? (
        <div className='text-center py-12'>
          <h2 className='text-2xl font-bold'>{notFoundTitle}</h2>
          <div className='mt-2 text-sm text-muted-foreground'>
            {notFoundMsg || 'The requested record could not be found.'}
          </div>
        </div>
      ) : typeof children === 'function' ? (
        children()
      ) : (
        children
      )}
    </Sidebar>
  )
}
