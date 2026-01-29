import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface EmailVerificationCardProps {
  emailVerified?: boolean
}

export function EmailVerificationCard({ emailVerified = false }: EmailVerificationCardProps) {
  const { mutate: resendVerificationMutation, isPending } = useMutation({
    mutationFn: () => api.post('/auth/verify-email/resend'),
    onSuccess: (response) => {
      const message =
        response.data?.message ||
        'Verification email sent! Please check your inbox.'
      toast.success('Verification email sent!', { description: message })
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to send verification email.')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          Verify your email address to secure your account and enable all features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-medium'>
              Email Status:{' '}
              <span
                className={
                  emailVerified
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }>
                {emailVerified ? 'Verified' : 'Not Verified'}
              </span>
            </p>
            <p className='text-sm text-muted-foreground'>
              {emailVerified
                ? 'Your email has been verified.'
                : 'Please verify your email address to access all features.'}
            </p>
          </div>
          {!emailVerified ? (
            <Button
              variant='outline'
              onClick={() => resendVerificationMutation()}
              isLoading={isPending}
              loadingText='Sending…'>
              Resend Verification Email
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

