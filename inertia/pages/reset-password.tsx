import { Head, Link, router } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { toast } from 'sonner'
import * as yup from 'yup'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PublicLayout } from '@/components/layouts/public'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'


interface ResetPasswordValues {
  token: string
  newPassword: string
  confirmPassword: string
}

const resetPasswordSchema = yup.object({
  token: yup.string().required('Reset token is required'),
  newPassword: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long'),

  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
})

export default function ResetPassword({ qs }: { qs: { token: string } }) {
  const { token } = qs

  const formik = useFormik<ResetPasswordValues>({
    initialValues: {
      token: token || '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    onSubmit: (values) => {
      resetPasswordMutation(values)
    },
  })
  const { mutate: resetPasswordMutation, isPending, } = useMutation({
    mutationFn: (values: { token: string; newPassword: string }) =>
      api.post('/auth/reset-password', values),
    onSuccess: () => {
      toast.success('Password reset successfully!', {
        description: 'Redirecting to login...',
      })
      setTimeout(() => router.visit('/login'), 1000)
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to reset password. Please try again.')
    },
  })





  return (
    <PublicLayout showFooter={false}>
      <Head title='Reset Password' />
      <div className='max-w-screen-xl mx-auto px-6 py-12 flex items-start justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-2xl'>Reset Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={formik.handleSubmit} className='space-y-4'>
              {!token && (
                <Alert variant='destructive'>
                  <AlertDescription>
                    No reset token provided. Please use the link from your email.
                  </AlertDescription>
                </Alert>
              )}



              <div className='space-y-2'>
                <Label htmlFor='newPassword'>New Password</Label>
                <Input
                  id='newPassword'
                  type='password'
                  {...formik.getFieldProps('newPassword')}
                  placeholder='••••••••'
                  className={formik.touched.newPassword && formik.errors.newPassword ? 'border-destructive' : ''}
                />
                {formik.touched.newPassword && formik.errors.newPassword && (
                  <p className='text-sm text-destructive'>{formik.errors.newPassword}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirm Password</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  {...formik.getFieldProps('confirmPassword')}
                  placeholder='••••••••'
                  className={formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-destructive' : ''}
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <p className='text-sm text-destructive'>{formik.errors.confirmPassword}</p>
                )}
              </div>

              <Button type='submit' className='w-full' isLoading={isPending} loadingText='Resetting…'>
                Reset Password
              </Button>

              <div className='text-center text-sm text-muted-foreground'>
                <Link href='/login' className='text-primary hover:underline'>
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
