import { usePage } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface PasswordValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function PasswordTab() {
  const page = usePage()
  const user = page.props.user as {
    emailVerified?: boolean
  }
  // Password update mutation
  const { mutate: updatePasswordMutation, isPending: isUpdatingPassword } = useMutation({
    mutationFn: (values: PasswordValues) => api.put('/user/password', values),
    onSuccess: () => {
      toast.success('Password updated successfully!')
      passwordFormik.resetForm()
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to update password. Please try again.')
    },
  })

  const passwordFormik = useFormik<PasswordValues>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: (values) => {
      if (values.newPassword !== values.confirmPassword) {
        toast.error('New passwords do not match')
        return
      }
      updatePasswordMutation(values)
    },
  })

  const isFormDisabled = !user?.emailVerified

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your password to keep your account secure.</CardDescription>
      </CardHeader>
      <CardContent>
        {!user?.emailVerified && (
          <div className='rounded-lg border-destructive/50 text-destructive border p-4 mb-4'>
            <p className='text-sm'>
              <strong>Email verification required:</strong> Please verify your email address before
              changing your password.
            </p>
          </div>
        )}
        <form onSubmit={passwordFormik.handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='currentPassword'>Current Password</Label>
            <Input
              id='currentPassword'
              name='currentPassword'
              type='password'
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              required
              placeholder='••••••••'
              disabled={isFormDisabled}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='newPassword'>New Password</Label>
            <Input
              id='newPassword'
              name='newPassword'
              type='password'
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              required
              placeholder='••••••••'
              disabled={isFormDisabled}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm New Password</Label>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              required
              placeholder='••••••••'
              disabled={isFormDisabled}
            />
          </div>

          <Button type='submit' disabled={isFormDisabled} isLoading={isUpdatingPassword} loadingText='Updating…'>
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
