'use client'

import { Link } from '@inertiajs/react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // You could also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className='flex min-h-screen items-center justify-center p-6 bg-background'>
          <div className='text-center max-w-md w-full'>
            {/* Error Visual */}
            <div className='relative mb-8'>
              <div className='text-[8rem] font-bold text-muted/20 leading-none select-none'>!</div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='bg-destructive/10 rounded-full p-6'>
                  <AlertCircle className='h-16 w-16 text-destructive' />
                </div>
              </div>
            </div>

            {/* Message */}
            <h1 className='text-3xl font-bold tracking-tight mb-3'>Something went wrong</h1>
            <p className='text-muted-foreground mb-6'>
              An unexpected error occurred. Please try refreshing the page or contact support if the
              problem persists.
            </p>

            {/* Error Details Card (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <Card className='mb-6 text-left'>
                <CardHeader>
                  <CardTitle className='text-sm'>Error Details</CardTitle>
                  <CardDescription className='text-xs font-mono break-all'>
                    {this.state.error.toString()}
                  </CardDescription>
                  {this.state.errorInfo && (
                    <CardDescription className='text-xs font-mono break-all mt-2'>
                      {this.state.errorInfo.componentStack}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            )}

            {/* Actions */}
            <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
              <Button
                variant='outline'
                onClick={this.handleReset}
                className='w-full sm:w-auto'
                leftIcon={<RefreshCw className='h-4 w-4' />}>
                Try Again
              </Button>
              <Link href='/'>
                <Button className='w-full sm:w-auto' leftIcon={<Home className='h-4 w-4' />}>
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
