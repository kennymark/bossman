// write a stripe service that will handle all stripe related operations,

import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import Stripe from 'stripe'

import type { CustomSubscriptionInfo } from '#extensions/event'
import Org from '#models/org'
import SubscriptionPlan from '#models/subscription_plan'
import env from '#start/env'
import type { AppEnv } from '#types/env'
import type { CreateCustomUserPayload } from '#validators/org'

import { getPlanName, getTrialPeriod } from '../data/subscription.js'

function getStripeKey(): string {
  if (app.inProduction) {
    return env.get('STRIPE_SECRET')
  }
  return env.get('STRIPE_TEST_KEY')
}

const getAppUrl = () => {
  if (app.inProduction) {
    return 'https://app.togetha.co.uk'
  }
  return 'https://dev.togetha.co.uk'
}

const stripe = new Stripe(getStripeKey(), {
  apiVersion: '2026-01-28.clover',
})

interface Customer {
  email: string
  name: string
  togethaUserId: string
}

export interface StripeTrial {
  startedAt: string
  endsAt: string
  isActive: boolean
  isExpired: boolean
}

export interface SubscriptionSummary {
  configured: true
  id: string
  customerId: string | null
  status: Stripe.Subscription.Status
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelAt: string | null
  canceledAt: string | null
  trial: StripeTrial | null
  priceId: string | null
  /** `standard_monthly` etc. when the price is a known catalogue price. */
  planName: string | null
  plan: { plan: string; frequency: string } | null
  /** Minor units (pence), per unit and in total for the quantity. */
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

export interface SubscriptionUnavailable {
  configured: false
  /** `no_subscription_id`: the org never subscribed; `not_found`: Stripe does not know the id. */
  reason: 'no_subscription_id' | 'not_found'
}

export interface InvoiceSummary {
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

export interface UpcomingInvoiceSummary {
  total: number
  amountDue: number
  currency: string
  /** When Stripe expects to bill it. */
  nextPaymentAttempt: string | null
  periodEnd: string | null
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null
}

function isMissingResource(err: unknown): boolean {
  return (
    err instanceof Stripe.errors.StripeInvalidRequestError &&
    (err.code === 'resource_missing' ||
      err.code === 'invoice_upcoming_none' ||
      err.statusCode === 404)
  )
}

function toInvoiceSummary(invoice: Stripe.Invoice): InvoiceSummary {
  return {
    id: invoice.id,
    number: invoice.number ?? null,
    status: invoice.status ?? null,
    total: invoice.total,
    amountDue: invoice.amount_due,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    created: isoFromUnix(invoice.created),
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
    paid: invoice.status === 'paid',
  }
}
class StripeService {
  public static async getSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  }

  getBalance() {
    return stripe.balance.retrieve()
  }

  public static async createCustomer({ email, name, togethaUserId }: Customer) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { togethaUserId },
      })

      logger.info({ customerId: customer.id }, 'Created Stripe customer')
      return customer
    } catch (error) {
      logger.error({ err: error }, 'Error creating Stripe customer')
    }
  }

  public static async removeCustomer(customerId: string) {
    await stripe.customers.del(customerId)
  }
  public static async createSubscription({
    plan,
    frequency,
    customerId,
    isTrial,
    connection,
  }: {
    plan: string
    frequency: string
    customerId: string
    isTrial: boolean
    connection: string
  }) {
    const subPlan = await SubscriptionPlan.query({ connection })
      .where({ name: isTrial ? 'standard' : plan, billingFrequency: frequency })
      .firstOrFail()

    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: subPlan.pricingId, quantity: 1 }],
        trial_period_days: isTrial ? 14 : undefined,
        default_tax_rates: app.inProduction
          ? ['txr_1Notp8HhNEQ5MjrcDK0s0HBK']
          : ['txr_1Nc7skHhNEQ5MjrczBFSUHXa'],
      })

      return subscription
    } catch (err) {
      throw new Error(err)
    }
  }

  public static async createCustomSubscription({
    customerId,
    data,
    featureList,
  }: {
    customerId: string
    data: CustomSubscriptionInfo
    featureList: CreateCustomUserPayload['featureList']
  }) {
    const stripifyPrice = (price: number) => price * 100
    const isMonthly = data.frequency === 'monthly'
    const currIsUk = data.currency === 'gbp'

    const success_url = `${getAppUrl()}/stripe?success=true&customerId=${customerId}&plan=${'metered'}`

    const cancel_url = `${getAppUrl()}/stripe?cancelled=true&customerId=${customerId}`

    const ukPrice = 5
    const usAndEuPrice = 6
    // calculate the amount off based on the currency and the amount
    const amountOff = data.currency === 'gbp' ? ukPrice - data.amount : usAndEuPrice - data.amount
    const amountOffCalculation = isMonthly
      ? amountOff * featureList.tenantLimit
      : amountOff * 12 * featureList.tenantLimit
    let coupon: Stripe.Response<Stripe.Coupon> | undefined

    if ((currIsUk && data.amount !== ukPrice) || (!currIsUk && data.amount !== usAndEuPrice)) {
      //  only create a coupon if the price is different from the normal price
      coupon = await stripe.coupons.create({
        amount_off: stripifyPrice(amountOffCalculation),
        duration: 'forever',
        currency: data.currency,
      })
    }

    // togetha metered pricing
    const monthlyPriceId = 'price_1PY5AxHhNEQ5MjrctSprncNf'
    const yearlyPriceId = 'price_1PY5fDHhNEQ5Mjrcmi7nb2bT'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          quantity: featureList.tenantLimit,
          price: data.frequency === 'monthly' ? monthlyPriceId : yearlyPriceId,
        },
      ],
      customer: customerId,
      currency: data.currency,
      subscription_data: {
        trial_period_days: data.trialPeriodInDays > 0 ? data.trialPeriodInDays : undefined,
        description: 'Custom plan for togetha.co.uk',
      },
      ...(coupon?.id ? { discounts: [{ coupon: coupon.id }] } : {}),
      success_url,
      cancel_url,
    })

    return session
  }

  /**
   * Create a Stripe checkout session for an org whose custom payment schedule (amount/currency)
   * has been updated. Returns the session (with .url) so the customer can be emailed a link.
   */
  public static async createPriceUpdateSession(
    org: Org,
  ): Promise<Stripe.Response<Stripe.Checkout.Session> | null> {
    if (!org.paymentCustomerId || !org.customPaymentSchedule) {
      return null
    }
    const schedule = org.customPaymentSchedule as Record<string, unknown>
    const amount = Number(schedule.amount)
    const currency = String(schedule.currency ?? 'gbp')
    const frequency = (schedule.frequency ?? 'monthly') as 'monthly' | 'quarterly' | 'yearly'
    const trialPeriodInDays = Number(schedule.trialPeriodInDays ?? 0)
    const featureList = (org.featureList ?? org.customPlanFeatures) as Record<string, unknown>
    const tenantLimit = Number(featureList?.tenantLimit ?? 1)
    const data: CustomSubscriptionInfo = {
      amount,
      currency,
      frequency,
      trialPeriodInDays,
    }
    const featureListPayload: CreateCustomUserPayload['featureList'] = {
      propertyLimit: Number(featureList?.propertyLimit) ?? 20,
      tenantLimit,
      storageLimit: Number(featureList?.storageLimit) ?? 0,
      teamSizeLimit: Number(featureList?.teamSizeLimit) ?? 1,
      prioritySupport: Boolean(featureList?.prioritySupport),
      activityLogRetention: Number(featureList?.activityLogRetention) ?? 90,
      depositProtection: Boolean(featureList?.depositProtection),
      advancedReporting: Boolean(featureList?.advancedReporting),
      eSignDocsLimit: Number(featureList?.eSignDocsLimit) ?? 10,
      aiInvocationLimit: Number(featureList?.aiInvocationLimit) ?? 50,
      customTemplatesLimit: Number(featureList?.customTemplatesLimit) ?? 0,
    }
    const session = await StripeService.createCustomSubscription({
      customerId: org.paymentCustomerId,
      data,
      featureList: featureListPayload,
    })
    return session
  }
  static async createPrice(data: Stripe.PriceCreateParams, env: 'dev' | 'prod') {
    const productId = env === 'prod' ? 'prod_Twz5vY3ayNdo3Z' : 'prod_TwythEksEkJ3Jc'
    const price = await stripe.prices.create({ product: productId, ...data })
    return price
  }

  public async viewInvoices(orgId: string, env: string) {
    const org = await Org.query({ connection: env }).where('id', orgId).firstOrFail()
    if (!org.paymentCustomerId) {
      return { data: [] }
    }
    const result = await stripe.invoices.list({
      customer: org.paymentCustomerId,
      limit: 100,
    })
    return result
  }

  /**
   * Create a draft invoice for a Stripe customer (see https://docs.stripe.com/api/invoices/create).
   * The invoice stays in draft until finalized in Stripe.
   */
  public static async createDraftInvoice(
    customerId: string,
    options?: { description?: string },
  ): Promise<Stripe.Invoice> {
    const invoice = await stripe.invoices.create({
      customer: customerId,
      ...(options?.description ? { description: options.description } : {}),
    })
    return invoice
  }

  /**
   * Add a line item to an existing draft invoice (see https://docs.stripe.com/api/invoiceitems/create).
   * Amount is in cents; currency in lowercase (e.g. gbp).
   */
  public static async createInvoiceItem(
    customerId: string,
    invoiceId: string,
    params: { amount: number; currency: string; description: string },
  ): Promise<Stripe.InvoiceItem> {
    const item = await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoiceId,
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      description: params.description || undefined,
    })
    return item
  }

  /**
   * A read-only picture of an org's subscription for the billing tab.
   *
   * `appEnv` decides which price-id table names the plan: the dev database subscribes
   * against Stripe test prices, production against live ones. The key itself is still
   * chosen by `getStripeKey`; nothing here logs or returns it.
   */
  public static async getSubscriptionSummary(
    subscriptionId: string | null | undefined,
    appEnv: AppEnv,
  ): Promise<SubscriptionSummary | SubscriptionUnavailable> {
    if (!subscriptionId) return { configured: false, reason: 'no_subscription_id' }

    let subscription: Stripe.Subscription
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method', 'latest_invoice'],
      })
    } catch (err) {
      if (isMissingResource(err)) return { configured: false, reason: 'not_found' }
      throw err
    }

    const item = subscription.items.data[0]
    const price = item?.price ?? null
    const plan = price ? getPlanName(price.id, appEnv) : null
    const trial = getTrialPeriod(subscription)
    const quantity = item?.quantity ?? 1
    const unitAmount = price?.unit_amount ?? null

    const paymentMethod =
      subscription.default_payment_method && typeof subscription.default_payment_method === 'object'
        ? subscription.default_payment_method
        : null
    const latestInvoice =
      subscription.latest_invoice && typeof subscription.latest_invoice === 'object'
        ? subscription.latest_invoice
        : null

    return {
      configured: true,
      id: subscription.id,
      customerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
      status: subscription.status,
      currentPeriodStart: isoFromUnix(item?.current_period_start),
      currentPeriodEnd: isoFromUnix(item?.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: isoFromUnix(subscription.cancel_at),
      canceledAt: isoFromUnix(subscription.canceled_at),
      trial: trial
        ? {
            startedAt: trial.startedAt.toISOString(),
            endsAt: trial.endsAt.toISOString(),
            isActive: trial.isActive,
            isExpired: trial.isExpired,
          }
        : null,
      priceId: price?.id ?? null,
      planName: plan?.fullName ?? price?.nickname ?? null,
      plan: plan ? { plan: plan.plan, frequency: plan.frequency } : null,
      unitAmount,
      amount: unitAmount === null ? null : unitAmount * quantity,
      quantity,
      currency: price?.currency ?? subscription.currency ?? null,
      interval: price?.recurring?.interval ?? null,
      intervalCount: price?.recurring?.interval_count ?? null,
      paymentMethod: paymentMethod
        ? {
            type: paymentMethod.type,
            brand: paymentMethod.card?.brand ?? null,
            last4: paymentMethod.card?.last4 ?? null,
          }
        : null,
      latestInvoice: latestInvoice
        ? {
            id: latestInvoice.id,
            status: latestInvoice.status ?? null,
            hostedInvoiceUrl: latestInvoice.hosted_invoice_url ?? null,
          }
        : null,
      createdAt: new Date(subscription.created * 1000).toISOString(),
    }
  }

  /** The most recent invoices for a customer, newest first. */
  public static async listInvoices(
    customerId: string | null | undefined,
    limit = 12,
  ): Promise<InvoiceSummary[]> {
    if (!customerId) return []
    const result = await stripe.invoices.list({
      customer: customerId,
      limit: Math.min(Math.max(limit, 1), 100),
    })
    return result.data.map(toInvoiceSummary)
  }

  /**
   * What Stripe would bill next, or null when there is nothing scheduled.
   *
   * Stripe answers a customer with no active subscription with a 404, which is a
   * normal state for a churned org rather than an error.
   */
  public static async getUpcomingInvoice(
    customerId: string | null | undefined,
  ): Promise<UpcomingInvoiceSummary | null> {
    if (!customerId) return null
    try {
      const invoice = await stripe.invoices.createPreview({ customer: customerId })
      return {
        total: invoice.total,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        nextPaymentAttempt: isoFromUnix(invoice.next_payment_attempt),
        periodEnd: isoFromUnix(invoice.period_end),
      }
    } catch (err) {
      if (isMissingResource(err)) return null
      throw err
    }
  }
}

export default StripeService
