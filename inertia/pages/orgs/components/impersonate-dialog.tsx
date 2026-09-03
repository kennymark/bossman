import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { AppEnv } from '#types/env'
import {
  CONFIRMATION_PHRASES,
  confirmationMatches,
  MIN_REASON_LENGTH,
  reasonIsValid,
} from '#utils/confirmation'
import { timeAgo } from '#utils/date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BaseDialog } from '@/components/ui/base-dialog'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

/** Mirrors `ImpersonationTarget` in `app/services/impersonation_service.ts`. */
export interface ImpersonationTarget {
  id: string
  name: string | null
  email: string
  role: string | null
  lastLoginAt: string | null
  isOwner: boolean
}

interface ImpersonateResponse {
  url: string
  expiresAt: string
}

export interface ImpersonateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  appEnv: AppEnv
  isGodAdmin: boolean
}

/**
 * "Log in as" for one of the org's users.
 *
 * The dialog collects who, why, and a retyped confirmation, then opens the signed
 * handoff link the server returns in a new tab. The link is good for 90 seconds and
 * works once; the server enforces every rule the dialog also checks.
 */
export function ImpersonateDialog({
  open,
  onOpenChange,
  orgId,
  appEnv,
  isGodAdmin,
}: ImpersonateDialogProps) {
  const isProdBlocked = appEnv === 'prod' && !isGodAdmin

  const [userId, setUserId] = useState('')
  const [reason, setReason] = useState('')
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    if (open) return
    setUserId('')
    setReason('')
    setConfirmation('')
  }, [open])

  const targets = useQuery({
    queryKey: ['impersonation-targets', appEnv, orgId],
    enabled: open && !isProdBlocked,
    queryFn: async () => {
      const res = (await api.impersonation.targets({ params: { orgId } })) as unknown as {
        data: ImpersonationTarget[]
      }
      return res.data
    },
  })

  /**
   * Opens on the customer themselves.
   *
   * This dialog is only reached from one customer's page, so the owner is who the
   * operator came here to sign in as. Making them pick that person out of a list of
   * their own tenants and team members was busywork. The picker stays for the times
   * they want somebody else.
   */
  useEffect(() => {
    if (!open || userId || !targets.data?.length) return
    const owner = targets.data.find((target) => target.isOwner)
    setUserId((owner ?? targets.data[0]).id)
  }, [open, userId, targets.data])

  const selected = targets.data?.find((target) => target.id === userId)
  const expectedPhrase = selected ? CONFIRMATION_PHRASES['org.impersonate'](selected.email) : ''
  const isReasonValid = reasonIsValid(reason)
  const isConfirmed = !!selected && confirmationMatches(confirmation, expectedPhrase)
  const canSubmit = !isProdBlocked && !!selected && isReasonValid && isConfirmed

  const mutation = useMutation({
    mutationFn: async () =>
      (await api.impersonation.create({
        params: { orgId },
        body: { userId, reason, confirmation },
      } as never)) as unknown as ImpersonateResponse,
    onSuccess: (res) => {
      const opened = window.open(res.url, '_blank', 'noopener')
      const expires = new Date(res.expiresAt)
      const expiresIn = Math.max(0, Math.round((expires.getTime() - Date.now()) / 1000))

      toast.success(
        opened
          ? `Signed in as ${selected?.email ?? 'the user'} in a new tab.`
          : 'Your browser blocked the new tab. Use "Open" to continue.',
        {
          description: `The link expires at ${expires.toLocaleTimeString()} (in ${expiresIn}s) and only works once.`,
          duration: Math.max(8000, Math.min(expiresIn * 1000, 90_000)),
          action: { label: 'Open', onClick: () => window.open(res.url, '_blank', 'noopener') },
        },
      )
      onOpenChange(false)
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Could not start the impersonation session.')
    },
  })

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Log in as a customer'
      description={`Opens the Togetha ${appEnv === 'prod' ? 'production' : 'development'} app in a new tab, signed in as the user you choose. The action is recorded in the audit trail and visible to the customer.`}
      primaryText={mutation.isPending ? 'Preparing…' : 'Open session'}
      primaryVariant='destructive'
      secondaryText='Cancel'
      isLoading={mutation.isPending}
      primaryDisabled={!canSubmit || mutation.isPending}
      onSecondaryAction={() => onOpenChange(false)}>
      {isProdBlocked ? (
        <Alert variant='destructive'>
          <AlertTitle>Production impersonation needs a god admin</AlertTitle>
          <AlertDescription>
            Signing in as a production customer is limited to god admins. Switch to the development
            environment, or ask a god admin to run this session.
          </AlertDescription>
        </Alert>
      ) : (
        <form
          id='impersonate-form'
          className='space-y-4'
          onSubmit={(event) => {
            event.preventDefault()
            if (canSubmit && !mutation.isPending) mutation.mutate()
          }}>
          <FormField
            label='User'
            htmlFor='impersonate-user'
            required
            description='Starts on the org owner. Also lists anyone whose primary org is this one.'
            error={targets.isError ? 'Could not load the users for this org.' : undefined}>
            <Select
              id='impersonate-user'
              value={userId || null}
              onValueChange={(value) => {
                setUserId(value ?? '')
                setConfirmation('')
              }}
              disabled={targets.isLoading || !targets.data?.length}>
              <SelectTrigger className='w-full'>
                {/* Given nothing to show, Base UI renders the raw value — here a user id. */}
                {selected ? (
                  <SelectValue>{selected.email}</SelectValue>
                ) : (
                  <SelectValue
                    placeholder={
                      targets.isLoading
                        ? 'Loading users…'
                        : targets.data?.length
                          ? 'Choose a user'
                          : 'No users found for this org'
                    }
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                {targets.data?.map((target) => (
                  <SelectItem key={target.id} value={target.id}>
                    {target.email}
                    {target.isOwner ? ' · owner' : target.role ? ` · ${target.role}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected ? (
              <p className='text-xs text-muted-foreground'>
                {selected.name || 'No name'} ·{' '}
                {selected.lastLoginAt
                  ? `last signed in ${timeAgo(selected.lastLoginAt)}`
                  : 'never signed in'}
              </p>
            ) : null}
          </FormField>

          <FormField
            label='Reason'
            htmlFor='impersonate-reason'
            required
            description={`Recorded in the audit trail. At least ${MIN_REASON_LENGTH} characters.`}
            error={reason && !isReasonValid ? 'Say a little more about why.' : undefined}>
            <Textarea
              id='impersonate-reason'
              name='reason'
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder='e.g. Support ticket #4821 — reproducing a payment that shows twice'
              rows={3}
              className='resize-none'
            />
          </FormField>

          <FormField
            label='Confirmation'
            htmlFor='impersonate-confirmation'
            required
            description={
              selected ? (
                <>
                  Type <span className='font-mono text-foreground'>{expectedPhrase}</span> to
                  continue.
                </>
              ) : (
                'Choose a user first.'
              )
            }
            error={confirmation && selected && !isConfirmed ? 'That does not match.' : undefined}>
            <Input
              id='impersonate-confirmation'
              name='confirmation'
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={expectedPhrase || 'impersonate user@example.com'}
              autoComplete='off'
              disabled={!selected}
            />
          </FormField>
        </form>
      )}
    </BaseDialog>
  )
}
