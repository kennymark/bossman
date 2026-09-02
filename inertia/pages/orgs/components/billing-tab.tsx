import { usePage } from '@inertiajs/react'
import {
  IconAlertTriangle,
  IconCreditCard,
  IconExternalLink,
  IconFileText,
  IconGauge,
  IconReceipt,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'

import type { AppEnv } from '#types/env'
import type { Column } from '#types/extra'
import { formatCurrency, type TogethaCurrencies } from '#utils/currency'
import { startCase } from '#utils/functions'
import type { EffectiveFeatures, LimitRow, LimitStatus, PlanUsage } from '#utils/plan_features'
import { DataTable } from '@/components/dashboard/data-table'
import DetailRow from '@/components/dashboard/detail-row'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton } from '@/components/ui/loading'
import { dateFormatter } from '@/lib/date'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'
import { cn } from '@/lib/utils'

/**
 * Response shapes for `OrgBillingController`. Declared here until the Tuyau registry
 * is regenerated against the implemented controller.
 */
interface SubscriptionSummary {
  configured: true
  id: string
  customerId: string | null
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelAt: string | null
  canceledAt: string | null
  trial: { startedAt: string; endsAt: string; isActive: boolean; isExpired: boolean } | null
  priceId: string | null
  planName: string | null
  plan: { plan: string; frequency: string } | null
  unitAmount: number | null
  amount: number | null
  quantity: number
  currency: string | null
  interval: string | null
  intervalCount: number | null
  paymentMethod: { brand: string | null; last4: string | null; type: string } | null
  latestInvoice: { id: string; status: string | null; hostedInvoiceUrl: string | null } | null
  createdAt: string
}

interface SubscriptionUnavailable {
  configured: false
  reason: 'no_subscription_id' | 'not_found'
}

interface SubscriptionResponse {
  subscription: SubscriptionSummary | SubscriptionUnavailable
  customerId: string | null
  hasActiveSubscription: boolean
}

interface InvoiceSummary {
  id: string
  number: string | null
  status: string | null
  total: number
  amountDue: number
  amountPaid: number
  currency: string
  created: string | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  paid: boolean
}

interface InvoicesResponse {
  configured: boolean
  data: InvoiceSummary[]
  upcoming: {
    total: number
    amountDue: number
    currency: string
    nextPaymentAttempt: string | null
    periodEnd: string | null
  } | null
}

interface PlanResponse {
  plan: EffectiveFeatures
  usage: PlanUsage
  limits: LimitRow[]
}

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'

const SUBSCRIPTION_STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'success',
  trialing: 'info',
  past_due: 'warning',
  incomplete: 'warning',
  paused: 'secondary',
  unpaid: 'destructive',
  canceled: 'destructive',
  incomplete_expired: 'destructive',
}

const INVOICE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  paid: 'success',
  open: 'warning',
  draft: 'secondary',
  uncollectible: 'destructive',
  void: 'outline',
}

const LIMIT_STATUS_LABEL: Record<LimitStatus, string> = {
  ok: 'OK',
  near: 'Near limit',
  over: 'At limit',
  unknown: 'Unknown',
}

const LIMIT_STATUS_VARIANT: Record<LimitStatus, BadgeVariant> = {
  ok: 'success',
  near: 'warning',
  over: 'destructive',
  unknown: 'outline',
}

const LIMIT_BAR_CLASS: Record<LimitStatus, string> = {
  ok: 'bg-green-500',
  near: 'bg-amber-500',
  over: 'bg-red-500',
  unknown: 'bg-muted-foreground/30',
}

/** Stripe's test-mode dashboard lives under `/test/`; the dev database subscribes there. */
function stripeDashboardUrl(appEnv: AppEnv, path: string) {
  return `https://dashboard.stripe.com/${appEnv === 'dev' ? 'test/' : ''}${path}`
}

function money(minorUnits: number | null | undefined, currency: string | null | undefined) {
  if (minorUnits === null || minorUnits === undefined) return '—'
  return formatCurrency(minorUnits / 100, (currency ?? 'gbp').toLowerCase() as TogethaCurrencies)
}

function formatUsage(value: number | null, unit?: string) {
  if (value === null) return '—'
  const rounded = Number.isInteger(value) ? value : value.toFixed(2)
  return unit ? `${rounded} ${unit}` : String(rounded)
}

const invoiceColumns: Column<InvoiceSummary>[] = [
  {
    key: 'number',
    header: 'Invoice',
    minWidth: 140,
    cell: (row) => <span className='font-medium'>{row.number ?? row.id}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    width: 120,
    cell: (row) => (
      <Badge
        variant={INVOICE_STATUS_VARIANT[row.status ?? ''] ?? 'secondary'}
        className='capitalize'>
        {row.status ?? 'unknown'}
      </Badge>
    ),
  },
  {
    key: 'total',
    header: 'Total',
    width: 120,
    cell: (row) => money(row.total, row.currency),
  },
  {
    key: 'created',
    header: 'Date',
    width: 130,
    cell: (row) => (row.created ? dateFormatter(row.created) : '—'),
  },
  {
    key: 'links',
    header: '',
    width: 150,
    cell: (row) => (
      <div className='flex flex-wrap gap-1'>
        {row.hostedInvoiceUrl && (
          <Button variant='ghost' size='sm' asChild>
            <a
              href={row.hostedInvoiceUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1'>
              <IconExternalLink className='h-3.5 w-3.5' />
              Open
            </a>
          </Button>
        )}
        {row.invoicePdf && (
          <Button variant='ghost' size='sm' asChild>
            <a
              href={row.invoicePdf}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1'>
              <IconFileText className='h-3.5 w-3.5' />
              PDF
            </a>
          </Button>
        )}
      </div>
    ),
  },
]

function QueryError({ error, fallback }: { error: ServerErrorResponse; fallback: string }) {
  return (
    <Alert variant='destructive'>
      <IconAlertTriangle className='h-4 w-4' />
      <AlertTitle>Could not load</AlertTitle>
      <AlertDescription>{serverErrorResponder(error) || fallback}</AlertDescription>
    </Alert>
  )
}

function SubscriptionCard({ orgId, appEnv }: { orgId: string; appEnv: AppEnv }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['org', orgId, 'billing', 'subscription'],
    queryFn: async () =>
      (await api.orgBilling.subscription({
        params: { orgId },
      })) as unknown as SubscriptionResponse,
  })

  return (
    <AppCard title='Subscription' description='Live from Stripe'>
      {isPending ? (
        <LoadingSkeleton type='list' count={3} />
      ) : error ? (
        <QueryError error={error} fallback='Could not load the subscription.' />
      ) : !data.subscription.configured ? (
        <EmptyState
          icon={IconCreditCard}
          title={
            data.subscription.reason === 'not_found'
              ? 'Subscription not found in Stripe'
              : 'No Stripe subscription'
          }
          description={
            data.subscription.reason === 'not_found'
              ? 'The org has a subscription id that Stripe does not recognise for this key.'
              : 'This org has never subscribed through Stripe.'
          }
          action={
            data.customerId ? (
              <Button variant='outline' asChild>
                <a
                  href={stripeDashboardUrl(appEnv, `customers/${data.customerId}`)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-2'>
                  <IconExternalLink className='h-4 w-4' />
                  Open customer in Stripe
                </a>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <SubscriptionDetails subscription={data.subscription} appEnv={appEnv} />
      )}
    </AppCard>
  )
}

function SubscriptionDetails({
  subscription,
  appEnv,
}: {
  subscription: SubscriptionSummary
  appEnv: AppEnv
}) {
  const interval =
    subscription.interval &&
    (subscription.intervalCount && subscription.intervalCount > 1
      ? `every ${subscription.intervalCount} ${subscription.interval}s`
      : `per ${subscription.interval}`)

  return (
    <div className='space-y-6'>
      {subscription.trial?.isActive && (
        <Alert>
          <IconAlertTriangle className='h-4 w-4' />
          <AlertTitle>On trial</AlertTitle>
          <AlertDescription>
            Trial started {dateFormatter(subscription.trial.startedAt)} and ends{' '}
            {dateFormatter(subscription.trial.endsAt)}.
          </AlertDescription>
        </Alert>
      )}
      {subscription.cancelAtPeriodEnd && (
        <Alert variant='destructive'>
          <IconAlertTriangle className='h-4 w-4' />
          <AlertTitle>Cancels at period end</AlertTitle>
          <AlertDescription>
            The customer has cancelled. Access ends{' '}
            {subscription.currentPeriodEnd
              ? dateFormatter(subscription.currentPeriodEnd)
              : 'at the end of the current period'}
            .
          </AlertDescription>
        </Alert>
      )}

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        <DetailRow
          label='Status'
          value={
            <Badge
              variant={SUBSCRIPTION_STATUS_VARIANT[subscription.status] ?? 'secondary'}
              className='capitalize w-fit'>
              {subscription.status.replace(/_/g, ' ')}
            </Badge>
          }
        />
        <DetailRow
          label='Plan'
          value={subscription.planName ? startCase(subscription.planName) : 'Unrecognised price'}
        />
        <DetailRow
          label='Amount'
          value={
            subscription.amount === null
              ? 'Metered / custom'
              : `${money(subscription.amount, subscription.currency)}${interval ? ` ${interval}` : ''}`
          }
        />
        <DetailRow label='Quantity' value={subscription.quantity} />
        <DetailRow
          label='Current period'
          value={
            subscription.currentPeriodEnd
              ? `${subscription.currentPeriodStart ? dateFormatter(subscription.currentPeriodStart) : '?'} → ${dateFormatter(subscription.currentPeriodEnd)}`
              : '—'
          }
        />
        <DetailRow label='Started' value={dateFormatter(subscription.createdAt)} />
        <DetailRow
          label='Payment method'
          value={
            subscription.paymentMethod
              ? subscription.paymentMethod.brand
                ? `${startCase(subscription.paymentMethod.brand)} •••• ${subscription.paymentMethod.last4 ?? '????'}`
                : startCase(subscription.paymentMethod.type)
              : 'None on subscription'
          }
        />
        <DetailRow
          label='Latest invoice'
          value={
            subscription.latestInvoice ? (
              <span className='inline-flex items-center gap-2'>
                <Badge
                  variant={
                    INVOICE_STATUS_VARIANT[subscription.latestInvoice.status ?? ''] ?? 'secondary'
                  }
                  className='capitalize'>
                  {subscription.latestInvoice.status ?? 'unknown'}
                </Badge>
                {subscription.latestInvoice.hostedInvoiceUrl && (
                  <a
                    href={subscription.latestInvoice.hostedInvoiceUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-xs underline text-muted-foreground'>
                    view
                  </a>
                )}
              </span>
            ) : (
              '—'
            )
          }
        />
        <DetailRow
          label='Price id'
          value={<span className='font-mono text-xs'>{subscription.priceId ?? '—'}</span>}
        />
      </div>

      <div className='flex flex-wrap gap-2'>
        <Button variant='outline' asChild>
          <a
            href={stripeDashboardUrl(appEnv, `subscriptions/${subscription.id}`)}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2'>
            <IconExternalLink className='h-4 w-4' />
            Open subscription in Stripe
          </a>
        </Button>
        {subscription.customerId && (
          <Button variant='ghost' asChild>
            <a
              href={stripeDashboardUrl(appEnv, `customers/${subscription.customerId}`)}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2'>
              <IconExternalLink className='h-4 w-4' />
              Open customer
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

function InvoicesCard({ orgId }: { orgId: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['org', orgId, 'billing', 'invoices'],
    queryFn: async () =>
      (await api.orgBilling.invoices({ params: { orgId } })) as unknown as InvoicesResponse,
  })

  return (
    <AppCard title='Invoices' description='The twelve most recent Stripe invoices'>
      {error ? (
        <QueryError error={error} fallback='Could not load invoices.' />
      ) : (
        <div className='space-y-4'>
          {data?.upcoming && (
            <Alert>
              <IconReceipt className='h-4 w-4' />
              <AlertTitle>Upcoming</AlertTitle>
              <AlertDescription>
                {money(data.upcoming.amountDue, data.upcoming.currency)} due
                {data.upcoming.nextPaymentAttempt
                  ? ` on ${dateFormatter(data.upcoming.nextPaymentAttempt)}`
                  : data.upcoming.periodEnd
                    ? ` after ${dateFormatter(data.upcoming.periodEnd)}`
                    : ''}
                .
              </AlertDescription>
            </Alert>
          )}
          <DataTable
            columns={invoiceColumns}
            data={data?.data ?? []}
            loading={isPending}
            emptyIcon={IconReceipt}
            emptyMessage={
              data && !data.configured ? 'No Stripe customer for this org.' : 'No invoices yet.'
            }
          />
        </div>
      )}
    </AppCard>
  )
}

function UsageBar({ row }: { row: LimitRow }) {
  const width = row.percent === null ? 0 : Math.min(row.percent, 100)
  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between gap-2 text-sm'>
        <span className='font-medium'>{row.label}</span>
        <span className='flex items-center gap-2 text-muted-foreground'>
          <span>
            {formatUsage(row.used, row.unit)}
            {' / '}
            {row.limit === null ? 'no limit' : formatUsage(row.limit, row.unit)}
          </span>
          <Badge variant={LIMIT_STATUS_VARIANT[row.status]}>{LIMIT_STATUS_LABEL[row.status]}</Badge>
        </span>
      </div>
      <div
        className='h-2 w-full overflow-hidden rounded-full bg-muted'
        role='progressbar'
        aria-label={row.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={width}>
        <div
          className={cn('h-full rounded-full transition-all', LIMIT_BAR_CLASS[row.status])}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function PlanLimitsCard({ orgId }: { orgId: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['org', orgId, 'billing', 'plan'],
    queryFn: async () =>
      (await api.orgBilling.plan({ params: { orgId } })) as unknown as PlanResponse,
  })

  return (
    <AppCard
      title={
        <span className='inline-flex items-center gap-2'>
          <IconGauge className='h-4 w-4' />
          Plan limits
        </span>
      }
      description='Usage against the limits the product enforces'>
      {isPending ? (
        <LoadingSkeleton type='table' count={5} />
      ) : error ? (
        <QueryError error={error} fallback='Could not load plan usage.' />
      ) : (
        <div className='space-y-6'>
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>Effective plan</span>
            <Badge variant={data.plan.source === 'custom' ? 'indigo' : 'outline'}>
              {data.plan.source === 'custom'
                ? `Custom (based on ${data.plan.basePlanName ? startCase(data.plan.basePlanName) : 'no plan'})`
                : startCase(data.plan.planName)}
            </Badge>
          </div>
          <div className='space-y-5'>
            {data.limits.map((row) => (
              <UsageBar key={row.key} row={row} />
            ))}
          </div>
          <p className='text-xs text-muted-foreground'>
            A metric shown as unknown could not be read on this environment. "At limit" means the
            product already blocks the next action.
          </p>
        </div>
      )}
    </AppCard>
  )
}

export interface BillingTabProps {
  orgId: string
  orgName: string
}

export function BillingTab({ orgId }: BillingTabProps) {
  const { props } = usePage()
  const appEnv = ((props as { appEnv?: AppEnv }).appEnv ?? 'dev') as AppEnv

  return (
    <div className='space-y-6'>
      <SubscriptionCard orgId={orgId} appEnv={appEnv} />
      <div className='grid gap-6 lg:grid-cols-2'>
        <PlanLimitsCard orgId={orgId} />
        <InvoicesCard orgId={orgId} />
      </div>
    </div>
  )
}
