import { Head, Link, router } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { toast } from 'sonner'
import { PublicLayout } from '@/components/layouts/public'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface JoinTeamProps {
  invitation: null | {
    email: string
    teamName: string
    inviterName: string
    role: string
  }
  token?: string
  hasAccount?: boolean
  isAuthed?: boolean
  isAuthedAsInvitee?: boolean
  error?: string
}

export default function JoinTeam(props: JoinTeamProps) {
  const acceptMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/team-invitations/accept', payload),
    onSuccess: (response) => {
      toast.success('You joined the team')
      const redirectTo = (response.data as { redirectTo?: string }).redirectTo
      router.visit(redirectTo || '/teams')
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to accept invite')
    },
  })

  const formik = useFormik({
    initialValues: {
      fullName: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: (values) => {
      if (!props.token) return
      acceptMutation.mutate({ token: props.token, ...values })
    },
  })

  const canShowInvite = Boolean(props.invitation && props.token && !props.error)
  const isAuthed = Boolean(props.isAuthed)
  const isAuthedAsInvitee = Boolean(props.isAuthedAsInvitee)
  const hasAccount = Boolean(props.hasAccount)

  return (
    <PublicLayout showFooter={false}>
      <Head title='Join team' />
      <div className='min-h-[calc(100vh-56px)] flex items-center justify-center p-6'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Join team</CardTitle>
            <CardDescription>
              {canShowInvite ? (
                <>
                  You were invited to join <strong>{props.invitation?.teamName}</strong>
                </>
              ) : (
                'Use your invite link to join a team.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {props.error && (
              <Alert variant='destructive'>
                <AlertDescription>{props.error}</AlertDescription>
              </Alert>
            )}

            {canShowInvite && (
              <div className='space-y-1 text-sm text-muted-foreground'>
                <div>
                  <span className='font-medium text-foreground'>Invited email:</span> {props.invitation?.email}
                </div>
                <div>
                  <span className='font-medium text-foreground'>Invited by:</span> {props.invitation?.inviterName}
                </div>
              </div>
            )}

            {!canShowInvite && (
              <div className='text-sm text-muted-foreground'>
                <Link href='/' className='text-primary hover:underline'>
                  Go back home
                </Link>
              </div>
            )}

            {canShowInvite && hasAccount && !isAuthed && (
              <Alert>
                <AlertDescription>
                  An account already exists for <strong>{props.invitation?.email}</strong>. Please{' '}
                  <Link href='/login' className='text-primary hover:underline'>
                    log in
                  </Link>{' '}
                  to accept this invite.
                </AlertDescription>
              </Alert>
            )}

            {canShowInvite && isAuthed && !isAuthedAsInvitee && (
              <Alert variant='destructive'>
                <AlertDescription>
                  You&apos;re logged in with a different email. Please logout first
                  to accept this invite.
                </AlertDescription>
              </Alert>
            )}

            {canShowInvite && isAuthed && isAuthedAsInvitee && (
              <Button
                className='w-full'
                isLoading={acceptMutation.isPending}
                loadingText='Joining…'
                onClick={() => acceptMutation.mutate({ token: props.token })}>
                Join {props.invitation?.teamName}
              </Button>
            )}

            {canShowInvite && !isAuthed && !hasAccount && (
              <form onSubmit={formik.handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='fullName'>Full name</Label>
                  <Input
                    id='fullName'
                    name='fullName'
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder='Jane Doe'
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='password'>Password</Label>
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder='••••••••'
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Confirm password</Label>
                  <Input
                    id='confirmPassword'
                    name='confirmPassword'
                    type='password'
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder='••••••••'
                    required
                  />
                </div>

                <Button type='submit' className='w-full' isLoading={acceptMutation.isPending} loadingText='Joining…'>
                  Create account & join {props.invitation?.teamName}
                </Button>

                <div className='text-center text-sm text-muted-foreground'>
                  Already have an account?{' '}
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

