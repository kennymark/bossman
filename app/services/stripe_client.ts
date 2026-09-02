import Stripe from 'stripe'

import env from '#start/env'
import type { AppEnv } from '#types/env'

/**
 * Stripe client per application environment.
 *
 * `StripeService` picks its key from `app.inProduction`, which ties the Stripe account
 * to where *this* app runs. Analytics need the key that matches the customer database
 * being read: a god admin looking at `prod` from a local machine must see production
 * Stripe, and `dev` must never read it.
 */
const clients = new Map<AppEnv, Stripe>()

export function getStripeKey(appEnv: AppEnv): string | null {
  const key = appEnv === 'prod' ? env.get('STRIPE_SECRET') : env.get('STRIPE_TEST_KEY')
  const trimmed = typeof key === 'string' ? key.trim() : ''
  return trimmed.length > 0 ? trimmed : null
}

export function isStripeConfigured(appEnv: AppEnv): boolean {
  return getStripeKey(appEnv) !== null
}

/** Null when no key is set for the environment; callers report "not configured". */
export function getStripe(appEnv: AppEnv): Stripe | null {
  const cached = clients.get(appEnv)
  if (cached) return cached
  const key = getStripeKey(appEnv)
  if (!key) return null
  const client = new Stripe(key, { apiVersion: '2026-01-28.clover' })
  clients.set(appEnv, client)
  return client
}
