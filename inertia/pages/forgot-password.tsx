import { Head, Link } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { toast } from 'sonner'
import { PublicLayout } from '@/components/layouts/public'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface ForgotPasswordValues {
  email: string
}

export default function ForgotPassword() {
  const forgotPasswordMutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) => api.post('/auth/forgot-password', values),
    onSuccess: () => {
      toast.success('Reset email sent!', {
        description: 'Please check your inbox for instructions.',
      })
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to send reset email. Please try again.')
    },
  })

  const formik = useFormik<ForgotPasswordValues>({
    initialValues: {
      email: '',
    },
    onSubmit: (values) => {
      forgotPasswordMutation.mutate(values)
    },
  })

  return (
    <PublicLayout showFooter={false}>
      <Head title='Forgot Password' />
      <div className='max-w-screen-xl mx-auto px-6 py-12 flex items-start justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-2xl'>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forgotPasswordMutation.isSuccess ? (
              <div className='space-y-4 text-center'>
                <p className='text-sm text-muted-foreground'>
                  We've sent a password reset link to <strong>{formik.values.email}</strong>
                </p>
                <Link href='/login' className='block text-sm text-primary hover:underline'>
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={formik.handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                    placeholder='you@example.com'
                  />
                </div>

                <Button
                  type='submit'
                  className='w-full'
                  isLoading={forgotPasswordMutation.isPending}
                  loadingText='Sending…'>
                  Send Reset Link
                </Button>

                <div className='text-center text-sm text-muted-foreground'>
                  Remember your password?{' '}
                  <Link href='/login' className='text-primary hover:underline'>
                    Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
