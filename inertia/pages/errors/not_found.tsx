import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, Home } from 'lucide-react'
import { PublicLayout } from '@/components/layouts/public'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <PublicLayout>
      <Head title='Page Not Found - Friars Technologies' />
      <div className='flex-1 flex items-center justify-center p-6'>
        <div className='text-center max-w-md'>
          {/* 404 Visual */}
          <div className='relative mb-8'>
            <div className='text-[12rem] font-bold text-muted/20 leading-none select-none'>404</div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='bg-primary/10 rounded-full p-6'></div>
            </div>
          </div>

          {/* Message */}
          <h1 className='text-3xl font-bold tracking-tight mb-3'>Page Not Found</h1>
          <p className='text-muted-foreground mb-8'>
            Sorry, we couldn't find the page you're looking for. The page may have been moved,
            deleted, or never existed.
          </p>

          {/* Actions */}
          <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
            <Button
              variant='outline'
              onClick={() => router.visit(-1 as unknown as string)}
              className='w-full sm:w-auto'
              leftIcon={<ArrowLeft className='h-4 w-4' />}>
              Go Back
            </Button>
            <Link href='/'>
              <Button className='w-full sm:w-auto' leftIcon={<Home className='h-4 w-4' />}>
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
