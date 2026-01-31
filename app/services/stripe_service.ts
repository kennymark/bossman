// write a stripe service that will handle all stripe related operations,

import app from '@adonisjs/core/services/app'
import Stripe from 'stripe'
import type { CustomSubscriptionInfo } from '#extensions/event'
import Org from '#models/org'
import SubscriptionPlan from '#models/subscription_plan'
import env from '#start/env'
import type { CreateCustomUserPayload } from '#validators/org'

function getStripeKey(): string {
  if (app.inProduction) {
    return env.get('STRIPE_SECRET')
  }
  return env.get('STRIPE_TEST_KEY')
}

const stripe = new Stripe(getStripeKey(), {
  apiVersion: '2026-01-28.clover',
})

class StripeService {
  public static async getSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription
  }

  getBalance() {
    return stripe.balance.retrieve()
  }

  getCustomers({ limit = 10 }) {
    return stripe.customers.list({ limit })
  }

  getSubscriptions({ limit = 10 }) {
    return stripe.subscriptions.list({
      limit,
      status: 'active',
      expand: ['data.customer'],
    })
  }

  public static async createCustomer({
    email,
    name,
    togethaUserId,
  }: {
    email: string
    name: string
    togethaUserId: string
  }) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { togethaUserId },
      })

      console.log('created_stripe_customer', customer.id)
      return customer
    } catch (error) {
      console.log('error creating stripe customer', error)
    }
  }

  public static async createSubscription({
    plan,
    frequency,
    customerId,
    isTrial,
  }: {
    plan: string
    frequency: string
    customerId: string
    isTrial: boolean
  }) {
    const subPlan = await SubscriptionPlan.query()
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
      // only apply the coupon if the price is different from the normal price
      discounts: [{ coupon: coupon?.id }],
      success_url,
      cancel_url,
    })

    return session
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
    options?: { description?: string }
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
    params: { amount: number; currency: string; description: string }
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
}

export default StripeService
function getAppUrl() {
  return 'https://togetha.co.uk'
}
