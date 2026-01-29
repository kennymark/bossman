import { router } from '@inertiajs/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { Copy, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputOtp } from '@/components/ui/input_otp'
import { Label } from '@/components/ui/label'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface Setup2FAResponse {
  secret: string
  qrCode: string
  otpAuthUrl: string
}

interface Enable2FAResponse {
  message: string
  recoveryCodes: string[]
}

interface TwoFactorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnabled?: (recoveryCodes: string[]) => void
}

export function TwoFactorModal({ open, onOpenChange, onEnabled }: TwoFactorModalProps) {
  const queryClient = useQueryClient()
  const [setupData, setSetupData] = useState<Setup2FAResponse | null>(null)

  const { mutate: setup2FAMutation, isPending: isSettingUp } = useMutation({
    mutationFn: () => api.post<Setup2FAResponse>('/user/2fa/setup'),
    onSuccess: (response) => {
      setSetupData(response.data)
      toast.success('2FA setup started. Scan the QR code with your authenticator app.')
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to setup 2FA. Please try again.')
    },
  })

  const enableFormik = useFormik<{ token: string }>({
    initialValues: { token: '' },
    onSubmit: (values) => enable2FAMutation(values),
  })

  const { mutate: enable2FAMutation, isPending: isEnabling } = useMutation({
    mutationFn: (values: { token: string }) => api.post<Enable2FAResponse>('/user/2fa/enable', values),
    onSuccess: (response) => {
      const data = response.data
      onEnabled?.(data.recoveryCodes)
      toast.success('2FA enabled. Save your recovery codes!', {
        description: data.recoveryCodes.join(' '),
      })
      enableFormik.resetForm()
      setSetupData(null)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      router.reload()
      onOpenChange(false)
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Invalid verification code. Please try again.')
    },
  })

  useEffect(() => {
    if (!open) {
      setSetupData(null)
      enableFormik.resetForm()
      return
    }
    // Auto-start setup when modal opens
    if (!setupData) setup2FAMutation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
          </DialogDescription>
        </DialogHeader>

        {!setupData ? (
          <div className='space-y-4'>
            <Alert>
              <Shield className='h-4 w-4' />
              <AlertDescription>
                Preparing your QR code…
              </AlertDescription>
            </Alert>
            <Button
              type='button'
              variant='outline'
              isLoading={isSettingUp}
              loadingText='Setting up…'
              onClick={() => setup2FAMutation()}>
              Retry setup
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='flex justify-center p-4 bg-muted rounded-lg'>
              <img src={setupData.qrCode} alt='2FA QR Code' className='w-56 h-56' />
            </div>

            <div className='space-y-2'>
              <Label>Secret Key (Manual Entry)</Label>
              <div className='flex gap-2'>
                <Input value={setupData.secret} readOnly className='font-mono' />
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  onClick={() => {
                    navigator.clipboard.writeText(setupData.secret)
                    toast.success('Secret key copied')
                  }}>
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>
                If you can’t scan the QR code, enter this secret manually in your app.
              </p>
            </div>

            <form onSubmit={enableFormik.handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='twoFactorToken'>Verification code</Label>
                <InputOtp
                  value={enableFormik.values.token}
                  onChange={(next) => enableFormik.setFieldValue('token', next)}
                  onComplete={() => enableFormik.submitForm()}
                  length={6}
                  disabled={isEnabling}
                  autoFocus
                  inputClassName='h-8 w-10 text-lg'
                />
                <p className='text-xs text-muted-foreground'>
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>

              <div className='flex gap-2'>
                <Button
                  type='submit'
                  disabled={!enableFormik.values.token}
                  isLoading={isEnabling}
                  loadingText='Enabling…'>
                  Enable 2FA
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setSetupData(null)
                    enableFormik.resetForm()
                    onOpenChange(false)
                  }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

