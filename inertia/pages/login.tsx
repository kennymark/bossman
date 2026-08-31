import { Head, Link, router } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { useState } from 'react'
import { toast } from 'sonner'

import { PublicLayout } from '@/components/layouts/public'
import { Alert, AlertDescription } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password_input'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface LoginValues {
  email: string
  password: string
  remember: boolean
}

interface LoginProps {
  isDev: boolean
  errors: {
    message: string
  }
}

interface LoginResponse {
  data?: {
    redirectTo?: string
    /** Set when the account has 2FA on: no session exists yet, a code is required. */
    requiresTwoFactor?: boolean
  }
}

interface ChallengeResponse {
  data?: {
    redirectTo?: string
    recoveryCodesRemaining?: number
  }
}

export default function Login({ errors, isDev }: LoginProps) {
  /**
   * Login is two steps whenever the account has 2FA enabled. The password step no
   * longer creates a session on its own — see `AuthController.login`.
   */
  const [step, setStep] = useState<'password' | 'code'>('password')
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const [code, setCode] = useState('')

  const onAuthenticated = (redirectTo?: string) => {
    const appEnv = localStorage.getItem('appEnv')
    if (!appEnv) localStorage.setItem('appEnv', 'dev')
    router.visit(redirectTo || '/dashboard')
  }

  const { mutate: loginMutation, isPending } = useMutation({
    mutationFn: (values: LoginValues) => api.post<LoginResponse>('/auth/login', values),
    onSuccess: (response) => {
      const data = (response.data as LoginResponse).data

      if (data?.requiresTwoFactor) {
        setStep('code')
        return
      }

      toast.success('Welcome back!', {
        description: 'You have been logged in successfully.',
      })
      onAuthenticated(data?.redirectTo)
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Invalid email or password')
    },
  })

  const { mutate: challengeMutation, isPending: isVerifying } = useMutation({
    mutationFn: (payload: { token?: string; recoveryCode?: string }) =>
      api.post<ChallengeResponse>('/auth/2fa/challenge', payload),
    onSuccess: (response) => {
      const data = (response.data as ChallengeResponse).data
      const remaining = data?.recoveryCodesRemaining

      toast.success('Welcome back!', {
        description:
          typeof remaining === 'number' && remaining <= 2
            ? `Only ${remaining} recovery code${remaining === 1 ? '' : 's'} left — generate new ones in Settings.`
            : 'You have been logged in successfully.',
      })
      onAuthenticated(data?.redirectTo)
    },
    onError: (err: ServerErrorResponse) => {
      const message = serverErrorResponder(err)
      toast.error(message || 'That code was not accepted')

      /** The challenge is spent — send them back to the password step. */
      if (err.response?.data?.type === 'challenge_expired') {
        setStep('password')
        setCode('')
        setUseRecoveryCode(false)
      }
    },
  })

  const formik = useFormik<LoginValues>({
    initialValues: {
      email: isDev ? 'kenneth@togetha.co.uk' : '',
      password: isDev ? 'password' : '',
      remember: false,
    },
    onSubmit: (values) => loginMutation(values),
  })

  const submitCode = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    challengeMutation(useRecoveryCode ? { recoveryCode: trimmed } : { token: trimmed })
  }

  return (
    <PublicLayout showFooter={false}>
      <Head title={step === 'code' ? 'Two-factor authentication' : 'Login'} />
      <div className='max-w-screen-xl mx-auto px-6 py-16 sm:py-24 flex items-start justify-center'>
        <Card className='w-full max-w-md border-border/80 shadow-lg'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-semibold tracking-tight'>
              {step === 'code' ? 'Two-factor authentication' : 'Login'}
            </CardTitle>
            <CardDescription className='text-[15px]'>
              {step === 'code'
                ? useRecoveryCode
                  ? 'Enter one of your recovery codes. Each can only be used once.'
                  : 'Enter the 6-digit code from your authenticator app.'
                : 'Enter your credentials to access your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors?.message && (
              <Alert variant='destructive'>
                <AlertDescription>{errors.message}</AlertDescription>
              </Alert>
            )}

            {step === 'password' ? (
              <form onSubmit={formik.handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    {...formik.getFieldProps('email')}
                    required
                    placeholder='you@example.com'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='password'>Password</Label>
                  <PasswordInput
                    id='password'
                    {...formik.getFieldProps('password')}
                    required
                    placeholder='••••••••'
                  />
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='remember'
                    checked={formik.values.remember}
                    onCheckedChange={(checked) => formik.setFieldValue('remember', checked)}
                  />
                  <Label htmlFor='remember' className='text-sm font-normal'>
                    Remember me
                  </Label>
                </div>

                <div className='flex flex-col space-y-2'>
                  <Button
                    type='submit'
                    className='w-full'
                    isLoading={isPending}
                    loadingText='Logging in…'>
                    Login
                  </Button>

                  <Link
                    href='/forgot-password'
                    className='text-sm text-primary hover:underline text-center'>
                    Forgot password?
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={submitCode} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='code'>
                    {useRecoveryCode ? 'Recovery code' : 'Authentication code'}
                  </Label>
                  <Input
                    id='code'
                    name='code'
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    autoFocus
                    autoComplete='one-time-code'
                    inputMode={useRecoveryCode ? 'text' : 'numeric'}
                    placeholder={useRecoveryCode ? 'XXXX-XXXX-XXXX-XXXX' : '123456'}
                    className='font-mono tracking-widest'
                  />
                </div>

                <div className='flex flex-col space-y-2'>
                  <Button
                    type='submit'
                    className='w-full'
                    isLoading={isVerifying}
                    loadingText='Verifying…'>
                    Verify and continue
                  </Button>

                  <button
                    type='button'
                    className='text-sm text-primary hover:underline text-center'
                    onClick={() => {
                      setUseRecoveryCode((current) => !current)
                      setCode('')
                    }}>
                    {useRecoveryCode
                      ? 'Use your authenticator app instead'
                      : "Can't access your app? Use a recovery code"}
                  </button>

                  <button
                    type='button'
                    className='text-sm text-muted-foreground hover:underline text-center'
                    onClick={() => {
                      setStep('password')
                      setCode('')
                      setUseRecoveryCode(false)
                    }}>
                    Back to sign in
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
