import { IconAlertTriangle, IconFlag, IconRestore } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { AppEnv } from '#types/env'
import type { Column } from '#types/extra'
import { CONFIRMATION_PHRASES, MIN_REASON_LENGTH, reasonIsValid } from '#utils/confirmation'
import { startCase } from '#utils/functions'
import type { EffectiveFeatures, FeatureMap, FeatureValue } from '#utils/plan_features'
import { DataTable } from '@/components/dashboard/data-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { BaseDialog } from '@/components/ui/base-dialog'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import { LoadingSkeleton } from '@/components/ui/loading'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'
import { cn } from '@/lib/utils'

/** Mirrors `FeatureDefinition` in `app/data/plans.ts`, as the endpoint sends it. */
interface FeatureDefinition {
  key: string
  label: string
  type: 'number' | 'boolean'
  unit?: string
  description: string
}

interface FeatureFlagsResponse extends EffectiveFeatures {
  orgId: string
  planId: number | null
  catalogue: FeatureDefinition[]
  confirmationPhrase: string
}

interface FlagRow {
  id: string
  key: string
  label: string
  type: 'number' | 'boolean'
  unit?: string
  description: string
  planDefault: FeatureValue | undefined
  effective: FeatureValue | undefined
  /** `custom` when the effective value differs from the plan default. */
  source: 'plan' | 'custom' | 'unset'
  inCatalogue: boolean
}

function formatValue(value: FeatureValue | undefined, unit?: string) {
  if (value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'On' : 'Off'
  return unit ? `${value} ${unit}` : String(value)
}

function buildRows(data: FeatureFlagsResponse): FlagRow[] {
  const known = new Set(data.catalogue.map((d) => d.key))
  const extraKeys = [...new Set([...Object.keys(data.features), ...Object.keys(data.planDefaults)])]
    .filter((key) => !known.has(key))
    .sort()

  const toRow = (def: FeatureDefinition, inCatalogue: boolean): FlagRow => {
    const planDefault = data.planDefaults[def.key]
    const effective = data.features[def.key]
    const source: FlagRow['source'] =
      effective === undefined ? 'unset' : effective === planDefault ? 'plan' : 'custom'
    return {
      id: def.key,
      key: def.key,
      label: def.label,
      type: def.type,
      unit: def.unit,
      description: def.description,
      planDefault,
      effective,
      source,
      inCatalogue,
    }
  }

  return [
    ...data.catalogue.map((def) => toRow(def, true)),
    ...extraKeys.map((key) => {
      const sample = data.features[key] ?? data.planDefaults[key]
      return toRow(
        {
          key,
          label: startCase(key),
          type: typeof sample === 'boolean' ? 'boolean' : 'number',
          description: 'Not in the plan catalogue; shown for reference and cannot be edited here.',
        },
        false,
      )
    }),
  ]
}

export interface FeatureFlagsTabProps {
  orgId: string
  orgName: string
  isGodAdmin: boolean
  appEnv: AppEnv
}

export function FeatureFlagsTab({ orgId, orgName, isGodAdmin, appEnv }: FeatureFlagsTabProps) {
  const queryClient = useQueryClient()
  const queryKey = ['org', orgId, 'feature-flags']

  const [draft, setDraft] = useState<FeatureMap>({})
  const [reason, setReason] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [resetReason, setResetReason] = useState('')
  const [resetConfirmation, setResetConfirmation] = useState('')

  const canEdit = appEnv !== 'prod' || isGodAdmin

  const { data, isPending, error } = useQuery({
    queryKey,
    queryFn: async () =>
      (await api.orgBilling.featureFlags({
        params: { orgId },
      })) as unknown as FeatureFlagsResponse,
  })

  const rows = useMemo(() => (data ? buildRows(data) : []), [data])

  /** Only keys whose draft differs from the current effective value are sent. */
  const pendingChanges = useMemo(() => {
    if (!data) return {}
    const out: FeatureMap = {}
    for (const [key, value] of Object.entries(draft)) {
      if (data.features[key] !== value) out[key] = value
    }
    return out
  }, [draft, data])

  const pendingCount = Object.keys(pendingChanges).length
  const reasonOk = reasonIsValid(reason)

  const setDraftValue = (key: string, value: FeatureValue) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const clearDraft = () => {
    setDraft({})
    setReason('')
  }

  const afterWrite = (response: FeatureFlagsResponse) => {
    queryClient.setQueryData(queryKey, response)
    queryClient.invalidateQueries({ queryKey: ['org', orgId, 'billing', 'plan'] })
  }

  const updateMutation = useMutation({
    mutationFn: async () =>
      (await api.orgBilling.updateFeatureFlags({
        params: { orgId },
        body: { features: pendingChanges, reason } as never,
      })) as unknown as FeatureFlagsResponse,
    onSuccess: (response) => {
      afterWrite(response)
      clearDraft()
      toast.success(`Saved ${pendingCount} feature flag change${pendingCount === 1 ? '' : 's'}.`)
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to save feature flags.')
    },
  })

  const resetMutation = useMutation({
    mutationFn: async () =>
      (await api.orgBilling.resetFeatureFlags({
        params: { orgId },
        body: { reason: resetReason, confirmation: resetConfirmation } as never,
      })) as unknown as FeatureFlagsResponse,
    onSuccess: (response) => {
      afterWrite(response)
      clearDraft()
      setResetOpen(false)
      setResetReason('')
      setResetConfirmation('')
      toast.success('Feature flags reset to the plan defaults.')
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to reset feature flags.')
    },
  })

  const expectedPhrase =
    data?.confirmationPhrase ?? CONFIRMATION_PHRASES['org.feature_flags_reset'](orgName)
  const resetReady =
    reasonIsValid(resetReason) &&
    resetConfirmation.trim().toLowerCase().replace(/\s+/g, ' ') ===
      expectedPhrase.trim().toLowerCase().replace(/\s+/g, ' ')

  const columns: Column<FlagRow>[] = [
    {
      key: 'feature',
      header: 'Feature',
      minWidth: 220,
      flex: 2,
      cell: (row) => (
        <div className='space-y-0.5'>
          <div className='font-medium'>{row.label}</div>
          <div className='text-xs text-muted-foreground'>{row.description}</div>
          <div className='font-mono text-[11px] text-muted-foreground'>{row.key}</div>
        </div>
      ),
    },
    {
      key: 'planDefault',
      header: 'Plan default',
      width: 130,
      cell: (row) => (
        <span className='text-muted-foreground'>{formatValue(row.planDefault, row.unit)}</span>
      ),
    },
    {
      key: 'effective',
      header: 'Effective',
      width: 170,
      cell: (row) => (
        <div className='flex items-center gap-2'>
          <span className='font-medium'>{formatValue(row.effective, row.unit)}</span>
          <Badge
            variant={
              row.source === 'custom' ? 'indigo' : row.source === 'unset' ? 'outline' : 'secondary'
            }>
            {row.source}
          </Badge>
        </div>
      ),
    },
    {
      key: 'editor',
      header: 'New value',
      width: 200,
      cell: (row) => {
        if (!row.inCatalogue)
          return <span className='text-xs text-muted-foreground'>read only</span>
        const current = draft[row.key] ?? row.effective
        const dirty = row.key in pendingChanges
        if (row.type === 'boolean') {
          return (
            <div className={cn('flex items-center gap-2', dirty && 'font-medium')}>
              <Switch
                aria-label={`Toggle ${row.label}`}
                checked={Boolean(current)}
                disabled={!canEdit || updateMutation.isPending}
                onCheckedChange={(checked) => setDraftValue(row.key, checked)}
              />
              <span className='text-sm'>{current ? 'On' : 'Off'}</span>
              {dirty && <Badge variant='warning'>changed</Badge>}
            </div>
          )
        }
        return (
          <div className='flex items-center gap-2'>
            <Input
              type='number'
              min={0}
              step={1}
              aria-label={`${row.label} value`}
              className={cn('h-8 w-28', dirty && 'border-primary')}
              value={typeof current === 'number' ? current : ''}
              disabled={!canEdit || updateMutation.isPending}
              onChange={(event) => {
                const next = event.target.value
                if (next === '') {
                  setDraft((state) => {
                    const { [row.key]: _removed, ...rest } = state
                    return rest
                  })
                  return
                }
                const parsed = Number(next)
                if (Number.isFinite(parsed) && parsed >= 0) setDraftValue(row.key, parsed)
              }}
            />
            {dirty && <Badge variant='warning'>changed</Badge>}
          </div>
        )
      },
    },
  ]

  return (
    <div className='space-y-6'>
      {!canEdit && (
        <Alert>
          <IconAlertTriangle className='h-4 w-4' />
          <AlertTitle>Read only in production</AlertTitle>
          <AlertDescription>
            Only a god admin can change feature flags on the production database.
          </AlertDescription>
        </Alert>
      )}

      <AppCard
        title={
          <span className='inline-flex items-center gap-2'>
            <IconFlag className='h-4 w-4' />
            Feature flags
          </span>
        }
        description='What the product enforces for this org. Saving writes a custom plan; the product then ignores the plan catalogue for this org until it is reset.'>
        {isPending ? (
          <LoadingSkeleton type='table' count={6} />
        ) : error ? (
          <Alert variant='destructive'>
            <IconAlertTriangle className='h-4 w-4' />
            <AlertTitle>Could not load</AlertTitle>
            <AlertDescription>
              {serverErrorResponder(error) || 'Could not load feature flags.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex flex-wrap items-center gap-2 text-sm'>
                <span className='text-muted-foreground'>Source</span>
                <Badge variant={data.source === 'custom' ? 'indigo' : 'outline'}>
                  {data.source === 'custom' ? 'Custom plan' : 'Plan defaults'}
                </Badge>
                <span className='text-muted-foreground'>Plan</span>
                <Badge variant='secondary'>
                  {data.basePlanName ? startCase(data.basePlanName) : 'None (standard fallback)'}
                </Badge>
              </div>
              <Button
                variant='outline'
                size='sm'
                disabled={!canEdit || data.source !== 'custom'}
                onClick={() => setResetOpen(true)}
                className='inline-flex items-center gap-2'>
                <IconRestore className='h-4 w-4' />
                Reset to plan defaults
              </Button>
            </div>

            <DataTable columns={columns} data={rows} emptyMessage='No features in the catalogue.' />

            {canEdit && (
              <div className='space-y-3 rounded-lg border p-4'>
                <FormField
                  label='Reason'
                  htmlFor='feature-flags-reason'
                  required
                  error={
                    reason && !reasonOk ? `At least ${MIN_REASON_LENGTH} characters.` : undefined
                  }>
                  <Textarea
                    id='feature-flags-reason'
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder='e.g. Support ticket #1234 — agreed a higher tenancy limit'
                    rows={2}
                    className='resize-none'
                  />
                </FormField>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-sm text-muted-foreground'>
                    {pendingCount === 0
                      ? 'No pending changes.'
                      : `${pendingCount} pending change${pendingCount === 1 ? '' : 's'}: ${Object.keys(pendingChanges).join(', ')}`}
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={pendingCount === 0 || updateMutation.isPending}
                      onClick={clearDraft}>
                      Discard
                    </Button>
                    <Button
                      size='sm'
                      disabled={pendingCount === 0 || !reasonOk || updateMutation.isPending}
                      onClick={() => updateMutation.mutate()}>
                      {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </AppCard>

      <BaseDialog
        open={resetOpen}
        onOpenChange={(open) => {
          setResetOpen(open)
          if (!open) {
            setResetReason('')
            setResetConfirmation('')
          }
        }}
        title='Reset feature flags to plan defaults'
        description={`This removes every custom feature override for ${orgName}. The product will fall back to the ${data?.basePlanName ? startCase(data.basePlanName) : 'standard'} catalogue immediately.`}
        primaryText='Reset flags'
        primaryVariant='destructive'
        primaryDisabled={!resetReady}
        isLoading={resetMutation.isPending}
        onPrimaryAction={() => resetMutation.mutate()}
        onSecondaryAction={() => setResetOpen(false)}>
        <div className='space-y-4'>
          <FormField label='Reason' htmlFor='reset-flags-reason' required>
            <Textarea
              id='reset-flags-reason'
              value={resetReason}
              onChange={(event) => setResetReason(event.target.value)}
              placeholder='Why the overrides are being removed'
              rows={2}
              className='resize-none'
            />
          </FormField>
          <FormField
            label={
              <>
                Type <span className='font-mono'>{expectedPhrase}</span> to confirm
              </>
            }
            htmlFor='reset-flags-confirmation'
            required>
            <Input
              id='reset-flags-confirmation'
              value={resetConfirmation}
              onChange={(event) => setResetConfirmation(event.target.value)}
              placeholder={expectedPhrase}
              autoComplete='off'
            />
          </FormField>
        </div>
      </BaseDialog>
    </div>
  )
}
