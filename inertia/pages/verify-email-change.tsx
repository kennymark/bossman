import { Head, Link } from '@inertiajs/react'
import { TokenVerificationShell } from '@/components/auth/token_verification_shell'
import { PublicLayout } from '@/components/layouts/public'
import { Button } from '@/components/ui/button'

export default function VerifyEmailChange({ qs }: { qs: { token: string } }) {
  const token = qs?.token

  return (
    <PublicLayout>
      <Head title='Confirm Email Change - Friars Technologies' />
      <TokenVerificationShell
        token={token}
        endpoint='/auth/verify-email-change'
        pendingTitle='Confirming Email Change'
        successTitle='Email Changed!'
        errorTitle='Email Change Failed'
        pendingDescription='Please wait while we confirm your new email address...'
        successDescription='Your email address has been successfully updated!'
        successToastTitle='Email address changed!'
        successToastDescription='Your email address has been successfully updated.'
        errorToastTitle='Email change failed'
        errorToastDescriptionFallback='Please try again or contact support.'
        redirectTo='/settings'
        redirectDelayMs={1000}
        errorHints={[
          'The confirmation link has expired',
          'The link has already been used',
          'The new email is already in use',
        ]}
        errorActions={
          <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
            <Button variant='outline' asChild className='w-full sm:w-auto'>
              <Link href='/settings'>Go to Settings</Link>
            </Button>
            <Button variant='ghost' asChild className='w-full sm:w-auto'>
              <Link href='/login'>Go to Login</Link>
            </Button>
          </div>
        }
      />
    </PublicLayout>
  )
}
