import { Head, Link } from '@inertiajs/react'
import { TokenVerificationShell } from '@/components/auth/token_verification_shell'
import { PublicLayout } from '@/components/layouts/public'
import { Button } from '@/components/ui/button'

export default function VerifyEmail({ qs }: { qs: { token: string } }) {
  const token = qs?.token

  return (
    <PublicLayout>
      <Head title='Verify Email - Friars Technologies' />
      <TokenVerificationShell
        token={token}
        endpoint='/auth/verify-email'
        pendingTitle='Verifying Your Email'
        successTitle='Email Verified!'
        errorTitle='Verification Failed'
        pendingDescription='Please wait while we verify your email address...'
        successDescription='Your email has been successfully verified! You can now access all features.'
        successToastTitle='Email verified!'
        successToastDescription='You can now access all features.'
        errorToastTitle='Verification failed'
        errorToastDescriptionFallback='Please request a new verification email.'
        redirectTo='/login'
        redirectDelayMs={2000}
        errorHints={[
          'The verification link has expired',
          'The link has already been used',
          'The link is invalid or corrupted',
        ]}
        errorActions={
          <Button variant='outline' asChild className='w-full sm:w-auto'>
            <Link href='/login'>Go to Login</Link>
          </Button>
        }
      />
    </PublicLayout>
  )
}
