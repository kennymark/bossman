import { Head, Link, router } from '@inertiajs/react'
import { AlertCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react'
import { PublicLayout } from '@/components/layouts/public'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ServerErrorProps {
  error: {
    message?: string
    code?: string
    status?: number
  }
}

export default function ServerError({ error }: ServerErrorProps) {
  return (
    <PublicLayout>
      <Head title='Server Error - Friars Technologies' />
      <div className='flex-1 flex items-center justify-center p-6'>
        <div className='text-center max-w-md w-full'>
          {/* 500 Visual */}
          <div className='relative mb-8'>
            <div className='text-[12rem] font-bold text-muted/20 leading-none select-none'>500</div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='bg-destructive/10 rounded-full p-6'>
                <AlertCircle className='h-16 w-16 text-destructive' />
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className='text-3xl font-bold tracking-tight mb-3'>Server Error</h1>
          <p className='text-muted-foreground mb-6'>
            We're sorry, but something went wrong on our end. Our team has been notified and is
            working to fix the issue.
          </p>

          {/* Error Details Card */}
          {error?.message && (
            <Card className='mb-6 text-left'>
              <CardHeader>
                <CardTitle className='text-sm'>Error Details</CardTitle>
                <CardDescription className='text-xs font-mono break-all'>
                  {error.message}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Actions */}
          <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
            <Button
              variant='outline'
              onClick={() => router.reload()}
              className='w-full sm:w-auto'
              leftIcon={<RefreshCw className='h-4 w-4' />}>
              Try Again
            </Button>
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
