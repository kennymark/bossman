import { router, usePage } from '@inertiajs/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { Copy, Download, KeyRound, Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { TwoFactorModal } from '@/components/settings/two_factor_modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password_input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { dateTimeFormatter } from '@/lib/date'
import { BaseDialog } from '@/components/ui/base-dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/seperator'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface Enable2FAResponse {
  message: string
  recoveryCodes: string[]
}

export function TwoFactorTab() {
  const page = usePage()
  const user = page.props.user as {
    twoFactorEnabled?: boolean
    emailVerified?: boolean
  }
  const queryClient = useQueryClient()
  const [showRecoveryCodes, setShowRecoveryCodes] = useState<string[]>([])
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)

  const isEnabled = user?.twoFactorEnabled || false

  // Disable 2FA mutation
  const disableFormik = useFormik<{ password: string }>({
    initialValues: { password: '' },
    onSubmit: (values) => {
      disable2FAMutation(values)
    },
  })

  const { mutate: disable2FAMutation, isPending: isDisabling } = useMutation({
    mutationFn: (values: { password: string }) => api.post('/user/2fa/disable', values),
    onSuccess: () => {
      disableFormik.resetForm()
      toast.success('2FA disabled successfully')
      queryClient.invalidateQueries({ queryKey: ['user'] })
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to disable 2FA. Please try again.')
    },
  })

  // Regenerate recovery codes mutation
  const regenerateFormik = useFormik<{ password: string }>({
    initialValues: { password: '' },
    onSubmit: (values) => {
      regenerateCodesMutation(values)
    },
  })

  const { mutate: regenerateCodesMutation, isPending: isRegenerating } = useMutation({
    mutationFn: (values: { password: string }) => api.post('/user/2fa/recovery-codes', values),
    onSuccess: (response) => {
      const data = response.data as Enable2FAResponse
      setShowRecoveryCodes(data.recoveryCodes)
      regenerateFormik.resetForm()
      toast.success('Recovery codes regenerated successfully!')
    },
    onError: (err: ServerErrorResponse) => {
      const error = serverErrorResponder(err)
      toast.error(error || 'Failed to regenerate recovery codes. Please try again.')
    },
  })

  const copyRecoveryCodes = () => {
    if (showRecoveryCodes.length > 0) {
      navigator.clipboard.writeText(showRecoveryCodes.join('\n'))
      toast.success('Recovery codes copied to clipboard')
    }
  }

  const downloadRecoveryCodes = () => {
    if (showRecoveryCodes.length > 0) {
      const content = `Two-Factor Authentication Recovery Codes\n\nSave these codes in a safe place. Each code can only be used once.\n\n${showRecoveryCodes.join('\n')}\n\nGenerated: ${dateTimeFormatter(new Date(), 'long')}`
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '2fa-recovery-codes.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {isEnabled ? (
              <>
                <ShieldCheck className='h-5 w-5 text-green-500' />
                Two-Factor Authentication (Enabled)
              </>
            ) : (
              <>
                <Shield className='h-5 w-5' />
                Two-Factor Authentication
              </>
            )}
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {isEnabled ? (
            <>
              <Alert>
                <ShieldCheck className='h-4 w-4' />
                <AlertDescription>
                  Two-factor authentication is currently enabled on your account.
                </AlertDescription>
              </Alert>

              <Separator />

              <div className='space-y-4'>
                <div>
                  <h3 className='text-sm font-medium mb-2'>Disable 2FA</h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Disable two-factor authentication for your account. You'll need to enter your
                    password to confirm.
                  </p>
                  <BaseDialog
                    title='Disable Two-Factor Authentication'
                    description='Enter your password to disable 2FA on your account.'
                    trigger={
                      <Button
                        variant='outline'
                        leftIcon={<ShieldOff />}
                        isLoading={isDisabling}
                        loadingText='Disabling…'>
                        Disable 2FA
                      </Button>
                    }
                    onSecondaryAction={() => disableFormik.resetForm()}
                    primaryText={isDisabling ? 'Disabling...' : 'Disable 2FA'}
                    primaryDisabled={isDisabling}
                    isLoading={isDisabling}>
                    <form id='disable-2fa-form' onSubmit={disableFormik.handleSubmit} className='space-y-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='disablePassword'>Password</Label>
                        <PasswordInput
                          id='disablePassword'
                          name='password'
                          value={disableFormik.values.password}
                          onChange={disableFormik.handleChange}
                          required
                          placeholder='Enter your password'
                        />
                      </div>
                    </form>
                  </BaseDialog>
                </div>

                <Separator />

                <div>
                  <h3 className='text-sm font-medium mb-2'>Recovery Codes</h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    If you lose access to your authenticator app, you can use these recovery codes
                    to access your account. Each code can only be used once.
                  </p>
                  <BaseDialog
                    title='Regenerate Recovery Codes'
                    description='Enter your password to generate new recovery codes. Your old codes will no longer work.'
                    trigger={
                      <Button
                        variant='outline'
                        leftIcon={<KeyRound />}
                        isLoading={isRegenerating}
                        loadingText='Regenerating…'>
                        Regenerate Recovery Codes
                      </Button>
                    }
                    onSecondaryAction={() => regenerateFormik.resetForm()}
                    primaryText={isRegenerating ? 'Regenerating...' : 'Regenerate Codes'}
                    primaryDisabled={isRegenerating}
                    isLoading={isRegenerating}>
                    <form id='regenerate-codes-form' onSubmit={regenerateFormik.handleSubmit} className='space-y-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='regeneratePassword'>Password</Label>
                        <PasswordInput
                          id='regeneratePassword'
                          name='password'
                          value={regenerateFormik.values.password}
                          onChange={regenerateFormik.handleChange}
                          required
                          placeholder='Enter your password'
                        />
                      </div>
                    </form>
                  </BaseDialog>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  Two-factor authentication adds an extra layer of security to your account. When enabled,
                  you'll need to enter a code from your authenticator app in addition to your password when
                  signing in.
                </p>
                <Button
                  onClick={() => setTwoFactorOpen(true)}
                  disabled={!user?.emailVerified}
                  leftIcon={<Shield />}>
                  Enable 2FA
                </Button>
                {!user?.emailVerified && (
                  <p className='text-xs text-muted-foreground'>Verify your email to enable 2FA.</p>
                )}
                <TwoFactorModal
                  open={twoFactorOpen}
                  onOpenChange={setTwoFactorOpen}
                  onEnabled={(codes) => setShowRecoveryCodes(codes)}
                />
              </div>
            </>
          )}

          {showRecoveryCodes.length > 0 && (
            <Alert className='mt-6'>
              <KeyRound className='h-4 w-4' />
              <AlertDescription>
                <div className='space-y-4'>
                  <div>
                    <p className='font-medium mb-2'>Save these recovery codes!</p>
                    <p className='text-sm mb-4'>
                      These codes can be used to access your account if you lose access to your
                      authenticator app. Each code can only be used once.
                    </p>
                  </div>
                  <div className='grid grid-cols-2 gap-2 font-mono text-sm bg-muted p-4 rounded-lg'>
                    {showRecoveryCodes.map((code) => (
                      <div key={code} className='flex items-center gap-2'>
                        <Badge variant='outline' className='font-mono'>
                          {code}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' onClick={copyRecoveryCodes}>
                      <Copy className='mr-2 h-4 w-4' />
                      Copy Codes
                    </Button>
                    <Button variant='outline' size='sm' onClick={downloadRecoveryCodes}>
                      <Download className='mr-2 h-4 w-4' />
                      Download
                    </Button>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowRecoveryCodes([])}
                    className='w-full'>
                    I've saved these codes
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
