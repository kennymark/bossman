import { Link, router } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Mail, MailCheck, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface TokenVerificationShellProps {
  token?: string
  endpoint: string
  pendingTitle: string
  successTitle: string
  errorTitle: string
  pendingDescription: string
  successDescription: string
  successToastTitle: string
  successToastDescription?: string
  errorToastTitle: string
  errorToastDescriptionFallback: string
  redirectTo: string
  redirectDelayMs: number
  errorHints?: string[]
  errorActions?: React.ReactNode
}

export function TokenVerificationShell({
  token,
  endpoint,
  pendingTitle,
  successTitle,
  errorTitle,
  pendingDescription,
  successDescription,
  successToastTitle,
  successToastDescription,
  errorToastTitle,
  errorToastDescriptionFallback,
  redirectTo,
  redirectDelayMs,
  errorHints = [],
  errorActions,
}: TokenVerificationShellProps) {
  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: async () => api.get(endpoint, { params: { token } }),
    onSuccess: () => {
      toast.success(successToastTitle, {
        description: successToastDescription,
      })
      setTimeout(() => router.visit(redirectTo), redirectDelayMs)
    },
    onError: (err: ServerErrorResponse) => {
      const errorMessage = serverErrorResponder(err)
      toast.error(errorToastTitle, {
        description: errorMessage || errorToastDescriptionFallback,
      })
    },
  })

  useEffect(() => {
    if (token) mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const errorMessage = error
    ? serverErrorResponder(error as ServerErrorResponse) || errorToastDescriptionFallback
    : errorToastDescriptionFallback

  return (
    <div className='flex-1 flex items-center justify-center p-6'>
      <div className='text-center max-w-md w-full'>
        <div className='relative mb-8'>
          {isPending ? (
            <>
              <div className='text-[8rem] font-bold text-muted/10 leading-none select-none'>
                <Mail className='h-32 w-32 mx-auto text-muted/20' />
              </div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='bg-primary/10 rounded-full p-8'>
                  <Loader2 className='h-16 w-16 text-primary animate-spin' />
                </div>
              </div>
            </>
          ) : null}

          {isSuccess ? (
            <>
              <div className='text-[8rem] font-bold text-green-500/10 leading-none select-none'>
                <MailCheck className='h-32 w-32 mx-auto text-green-500/20' />
              </div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='bg-green-500/10 rounded-full p-8 animate-in zoom-in duration-500'>
                  <CheckCircle2 className='h-16 w-16 text-green-500' />
                </div>
              </div>
            </>
          ) : null}

          {isError ? (
            <>
              <div className='text-[8rem] font-bold text-destructive/10 leading-none select-none'>
                <XCircle className='h-32 w-32 mx-auto text-destructive/20' />
              </div>
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='bg-destructive/10 rounded-full p-8'>
                  <XCircle className='h-16 w-16 text-destructive' />
                </div>
              </div>
            </>
          ) : null}
        </div>

        <Card className='border-0 shadow-none bg-transparent'>
          <CardHeader className='space-y-3'>
            <CardTitle className='text-3xl font-bold tracking-tight'>
              {isPending ? pendingTitle : null}
              {isSuccess ? successTitle : null}
              {isError ? errorTitle : null}
            </CardTitle>
            <CardDescription className='text-base'>
              {isPending ? <span className='text-muted-foreground'>{pendingDescription}</span> : null}
              {isSuccess ? <span className='text-green-600 dark:text-green-400'>{successDescription}</span> : null}
              {isError ? <span className='text-destructive'>{errorMessage}</span> : null}
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            {isSuccess ? (
              <div className='space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
                <div className='rounded-lg bg-green-500/10 border border-green-500/20 p-4'>
                  <p className='text-sm text-green-700 dark:text-green-300'>
                    <strong>Success!</strong> You&apos;ll be redirected shortly.
                  </p>
                </div>
                <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>Redirecting…</span>
                </div>
              </div>
            ) : null}

            {isError ? (
              <div className='space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
                {errorHints.length ? (
                  <div className='rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-left'>
                    <p className='text-sm text-destructive'>
                      <strong>Oops!</strong> This could happen if:
                    </p>
                    <ul className='mt-2 text-sm text-destructive/80 list-disc list-inside space-y-1'>
                      {errorHints.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {errorActions ? <div className='pt-2'>{errorActions}</div> : null}
              </div>
            ) : null}

            {isPending ? (
              <div className='space-y-2'>
                <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>Processing…</span>
                </div>
              </div>
            ) : null}

            {!token && !isPending ? (
              <div className='space-y-4'>
                <div className='rounded-lg bg-destructive/10 border border-destructive/20 p-4'>
                  <p className='text-sm text-destructive'>Verification token is missing.</p>
                </div>
                <Button variant='outline' asChild className='w-full sm:w-auto'>
                  <Link href='/login'>Go to Login</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

