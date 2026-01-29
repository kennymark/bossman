import { Head, Link, router } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
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
  errors: {
    message: string
  }
}
export default function Login({ errors }: LoginProps) {
  const { mutate: loginMutation, isPending } = useMutation({
    mutationFn: (values: LoginValues) => api.post('/auth/login', values),
    onSuccess: (response) => {
      toast.success('Welcome back!', {
        description: 'You have been logged in successfully.',
      })
      const data = (response.data as { data?: { redirectTo?: string } }).data
      router.visit(data?.redirectTo || '/dashboard')
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Invalid email or password')
    },
  })

  const formik = useFormik<LoginValues>({
    initialValues: {
      email: 'admin@test.com',
      password: 'password',
      remember: false,
    },
    onSubmit: (values) => loginMutation(values),
  })

  return (
    <PublicLayout showFooter={false}>
      <Head title='Login' />
      <div className='max-w-screen-xl mx-auto px-6 py-12 flex items-start justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-2xl'>Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            {errors?.message && (
              <Alert variant='destructive'>
                <AlertDescription>{errors.message}</AlertDescription>
              </Alert>
            )}
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
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
