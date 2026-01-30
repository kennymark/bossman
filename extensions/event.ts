import type Stripe from 'stripe'
import type Org from '#models/org'
import type TogethaUser from '#models/togetha_user'
import type User from '#models/user'
import type { CreateCustomUserPayload } from '#validators/org'

export interface CustomSubscriptionInfo {
  amount: number
  trialPeriodInDays: number
  frequency: 'monthly' | 'quarterly' | 'semiannual' | 'semi-annually' | 'yearly'
  currency: string
}
declare module '@adonisjs/core/types' {
  interface EventsList {
    'user:created': {
      user: User
      token: string
    }

    'new:custom-user': {
      user: TogethaUser
      org: Org
      customPaymentSchedule: CustomSubscriptionInfo
      featureList: CreateCustomUserPayload['featureList']
      subscription: Stripe.Response<Stripe.Checkout.Session>
    }
    'user:deleted': {
      user: User
    }
  }
}
