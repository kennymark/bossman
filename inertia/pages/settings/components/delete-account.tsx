import { router } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BaseDialog } from '@/components/ui/base-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password_input'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface DeleteAccountValues {
  password: string
}

export function AccountTab() {
  const { mutate: deleteAccountMutation, isPending: isDeleting } = useMutation({
    mutationFn: (values: DeleteAccountValues) => api.delete('/user/account', { data: values }),
    onSuccess: () => {
      toast.success('Account deleted successfully')
      router.visit('/')
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to delete account. Please try again.')
    },
  })

  const deleteFormik = useFormik<DeleteAccountValues>({
    initialValues: {
      password: '',
    },
    onSubmit: (values) => {
      deleteAccountMutation(values)
    },
  })

  return (
    <div className='space-y-6'>
      <Card className='border-destructive'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-destructive'>
            <AlertTriangle className='h-5 w-5' />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive' className='mb-4'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting your account will permanently remove all your data, including:
              <ul className='list-disc list-inside mt-2 space-y-1'>
                <li>Your profile information</li>
                <li>All your sessions</li>
                <li>Your account settings</li>
                <li>All associated data</li>
              </ul>
            </AlertDescription>
          </Alert>

          <BaseDialog
            title='Are you absolutely sure?'
            description='This action cannot be undone. This will permanently delete your account and remove all your data from our servers. Please enter your password to confirm.'
            trigger={
              <Button variant='destructive' leftIcon={<Trash2 />} isLoading={isDeleting} loadingText='Deleting…'>
                Delete Account
              </Button>
            }
            onSecondaryAction={() => deleteFormik.resetForm()}
            primaryText={isDeleting ? 'Deleting...' : 'Delete Account'}
            primaryVariant='destructive'
            primaryDisabled={isDeleting || !deleteFormik.values.password}
            isLoading={isDeleting}
            showSecondary={true}>
            <form
              id='delete-account-form'
              onSubmit={deleteFormik.handleSubmit}
              className='space-y-4'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target === e.currentTarget) {
                  e.preventDefault()
                }
              }}>
              <div className='space-y-2'>
                <Label htmlFor='deletePassword'>Password</Label>
                <PasswordInput
                  id='deletePassword'
                  name='password'
                  value={deleteFormik.values.password}
                  onChange={deleteFormik.handleChange}
                  onBlur={deleteFormik.handleBlur}
                  required
                  placeholder='Enter your password to confirm'
                  autoComplete='current-password'
                />
              </div>
            </form>
          </BaseDialog>
        </CardContent>
      </Card>
    </div>
  )
}
