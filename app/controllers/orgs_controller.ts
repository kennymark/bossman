import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import axios from 'axios'
import type Stripe from 'stripe'

import Activity from '#models/activity'
import Agency from '#models/agency'
import Landlord from '#models/landlord'
import Lease from '#models/lease'
import Org from '#models/org'
import Property from '#models/property'
import SubscriptionPlan from '#models/subscription_plan'
import TogethaTeam from '#models/togetha_teams'
import TogethaUser from '#models/togetha_user'
import mailer from '#services/email_service'
import { LoopService } from '#services/loop_service'
import OrgService from '#services/org_service'
import PermissionService from '#services/permission_service'
import StripeService from '#services/stripe_service'
import OrgTransformer from '#transformers/org_transformer'
import type { AppEnv } from '#types/env'
import type { AppCountries } from '#types/extra'
import type { CsvColumn } from '#utils/csv'
import { MAX_EXPORT_ROWS, sendCsv } from '#utils/csv_response'
import type { QueryParams } from '#utils/vine'
import { orgsExportValidator } from '#validators/exports'
import { createCustomerUserValidator, updateOrgValidator } from '#validators/org'
import { paginationQueryValidator } from '#validators/query'

/** Columns `?sortBy=` may name on the customers list. Identifiers, so never request input. */
const ORG_SORTABLE_COLUMNS = [
  'name',
  'owner_role',
  'country',
  'has_active_subscription',
  'created_at',
] as const

/**
 * The customers list, filtered and sorted exactly as the index shows it.
 *
 * Shared by `index` and `export` so the file an operator downloads is the list they
 * were looking at: the same test-account, favourite, type and name filters, in the
 * same order. Keeping one builder is what stops the two from drifting apart.
 */
function buildOrgsListQuery(params: QueryParams, appEnv: AppEnv) {
  const includeTestAccounts = params.includeTestAccounts === true
  const favouritesOnly = params.favouritesOnly === true
  const ownerRole =
    params.ownerRole === 'landlord' || params.ownerRole === 'agency' ? params.ownerRole : null

  const sortBy = ORG_SORTABLE_COLUMNS.includes(params.sortBy as (typeof ORG_SORTABLE_COLUMNS)[0])
    ? params.sortBy!
    : 'created_at'
  const sortOrder =
    params.sortOrder === 'asc' || params.sortOrder === 'desc' ? params.sortOrder : 'desc'

  const baseQuery = Org.query({ connection: appEnv })
    .if(!includeTestAccounts, (q) => q.where('isTestAccount', false))
    .if(favouritesOnly, (q) => q.where('isFavourite', true))
    .if(ownerRole, (q) => q.where('owner_role', ownerRole!))
    .if(params.search, (q) => q.whereILike('name', `%${params.search}%`))

  return { baseQuery, sortBy, sortOrder }
}

/**
 * What an operator gets when they export customers.
 *
 * Identifiers, contact details and flags only. Nothing from the Plaid, Xero or Stripe
 * Connect columns, and none of the JSON blobs (settings, pages, feature lists) —
 * those are for the org page, not a spreadsheet.
 */
const ORG_EXPORT_COLUMNS: readonly CsvColumn<Org>[] = [
  { header: 'ID', value: (org) => org.id },
  { header: 'Name', value: (org) => org.cleanName },
  { header: 'Company', value: (org) => org.companyName },
  { header: 'Type', value: (org) => org.ownerRole },
  { header: 'Country', value: (org) => org.country },
  { header: 'Owner email', value: (org) => org.creatorEmail },
  { header: 'Company email', value: (org) => org.companyEmail },
  { header: 'Website', value: (org) => org.companyWebsite },
  { header: 'Active subscription', value: (org) => Boolean(org.hasActiveSubscription) },
  { header: 'Plan ID', value: (org) => org.planId },
  { header: 'Stripe customer', value: (org) => org.paymentCustomerId },
  { header: 'Favourite', value: (org) => Boolean(org.isFavourite) },
  { header: 'Test account', value: (org) => Boolean(org.isTestAccount) },
  { header: 'Sales account', value: (org) => Boolean(org.isSalesOrg) },
  { header: 'Main org', value: (org) => Boolean(org.isMainOrg) },
  { header: 'White label', value: (org) => Boolean(org.isWhiteLabelEnabled) },
  { header: 'Parent org ID', value: (org) => org.parentOrgId },
  { header: 'Created at', value: (org) => org.createdAt?.toISO() ?? null },
  { header: 'Updated at', value: (org) => org.updatedAt?.toISO() ?? null },
]

export default class OrgsController {
  async index({ request, inertia }: HttpContext) {
    const params = await request.paginationQs()
    const { baseQuery, sortBy, sortOrder } = buildOrgsListQuery(params, request.appEnv())

    const [orgs, totalResult, landlordsResult, agenciesResult] = await Promise.all([
      baseQuery
        .clone()
        .sortBy(sortBy, sortOrder)
        .paginate(params.page || 1, params.perPage || 20),
      baseQuery.clone().getCount(),
      baseQuery.clone().where('owner_role', 'landlord').getCount(),
      baseQuery.clone().where('owner_role', 'agency').getCount(),
    ])

    const stats = {
      total: totalResult.total,
      landlords: landlordsResult.total,
      agencies: agenciesResult.total,
    }

    return inertia.render('orgs/index', {
      orgs: inertia.defer(async () => OrgTransformer.paginate(orgs.all(), orgs.getMeta())),
      stats,
    } as never)
  }

  async stats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const counts = await db.connection(appEnv).rawQuery(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE owner_role = 'landlord') AS landlords,
        COUNT(*) FILTER (WHERE owner_role = 'agency') AS agencies
      FROM orgs
    `)
    const data = counts.rows[0]
    return response.ok(data)
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('orgs/create', {} as never)
  }

  async store({ request, response, logger }: HttpContext) {
    const appEnv = request.appEnv()
    const payload = await request.validateUsing(createCustomerUserValidator)
    const trx = await db.connection(appEnv).transaction()
    const isCustomPlan = payload.customPaymentSchedule.planType === 'custom'
    const trxCon = { client: trx, connection: appEnv }

    logger.info(`isCustomPlan: ${isCustomPlan}`)
    const user = new TogethaUser().useTransaction(trxCon.client).useConnection(trxCon.connection)
    const existingUser = await TogethaUser.query(trxCon)
      .where('email', payload.email)
      .orWhere('contactNumber', payload.contactNumber)
      .first()

    if (existingUser) {
      return response.badRequest({
        error: 'A user with this email or phone number already exists',
      })
    }

    try {
      const subPlan = isCustomPlan
        ? undefined
        : await SubscriptionPlan.query({ client: trx, connection: appEnv })
            .where({
              name: payload.customPaymentSchedule.plan,
              billingFrequency: payload.customPaymentSchedule.frequency,
            })
            .first()

      logger.info(
        isCustomPlan
          ? 'No subscription plan found cos custom'
          : `Subscription plan ${subPlan?.name} found`,
      )
      // create a new organization with the subscription plan
      const org = await Org.create(
        {
          name: `${payload.name}_org`,
          ownerRole: payload.accountType,
          isMainOrg: true,
          planId: isCustomPlan ? undefined : subPlan?.id,
          creatorEmail: payload.email,
          country: payload.country as AppCountries,
          pages: isCustomPlan ? payload.pages : undefined,
          isWhiteLabelEnabled: payload.isWhiteLabelEnabled,
          customPlanFeatures: isCustomPlan ? payload.featureList : undefined,
          customPaymentSchedule: isCustomPlan ? payload.customPaymentSchedule : undefined,
        },
        trxCon,
      )

      logger.info(`Org ${org.name} created successfully`)
      org.merge({
        settings: {
          ...OrgService.getDefaultSettings(org.country),
          languagePreferences: payload.languagePreferences,
        },
      })
      logger.info(`Assigning default settings to org ${org.name}`)

      user.merge({
        password: payload.password,
        name: payload.name,
        email: payload.email,
        contactNumber: payload.contactNumber,
        addressLineOne: payload.addressLineOne,
        addressLineTwo: payload.addressLineTwo,
        sortCode: payload.sortCode,
        accountNumber: payload.accountNumber,
        city: payload.city,
        postCode: payload.postCode,
        role: 'owner',
        country: payload.country,
        metadata: { firstOrgId: org.id, plan: 'custom' },
      })

      const team = await TogethaTeam.create(
        {
          name: `${user.name} team`,
          orgId: org.id,
          description: `first team for ${user.name}`,
          userId: user.id,
        },
        trxCon,
      )
      logger.info(`Team created for ${user.name} with id ${team.id}`)

      await PermissionService.assignTogethaPermissions(user)
      logger.info(`${user.name} information saved successfully`)
      // create a stripe customer for the user
      const customer = await StripeService.createCustomer({
        email: user.email,
        name: user.name,
        togethaUserId: user.id,
      })
      logger.info(`Stripe customer created for ${user.name} with id ${customer?.id}`)

      await org.merge({ paymentCustomerId: customer?.id }).save()
      await user.save()

      if (payload.accountType === 'landlord') {
        logger.info('Creating landlord account')
        const landlord = await Landlord.create(
          { email: payload.email, name: payload.name },
          { client: trx, connection: appEnv },
        )
        await landlord.merge({ orgId: org.id }).save()
        await user.merge({ landlordId: landlord.id }).save()
      } else {
        logger.info('Creating agency account')
        const agency = await Agency.create(
          { email: payload.email, name: payload.name },
          { client: trx, connection: appEnv },
        )
        await user.merge({ agencyId: agency.id }).save()
        await agency.merge({ orgId: org.id }).save()
      }

      let session: Stripe.Response<Stripe.Checkout.Session> | undefined
      let subscription: Stripe.Response<Stripe.Subscription> | undefined

      if (isCustomPlan) {
        if (payload.customPaymentSchedule.paymentMethod === 'stripe') {
          session = await StripeService.createCustomSubscription({
            customerId: customer!.id,
            data: payload.customPaymentSchedule,
            featureList: payload.featureList,
          })
          logger.info(`Custom subscription session created`)
          logger.info(`${user.name} with sub_id ${session?.subscription}`)
          logger.info(`${user.name} with session_id ${session?.id}`)
        } else {
          logger.info('Bank transfer payment method selected')
        }
      } else {
        subscription = await StripeService.createSubscription({
          plan: payload.customPaymentSchedule.plan,
          frequency: payload.customPaymentSchedule.frequency,
          customerId: customer!.id,
          isTrial: payload.customPaymentSchedule.trialPeriodInDays > 0,
          connection: appEnv,
        })
        logger.info(`Subscription created for ${user.name} with id ${subscription?.id}`)
      }

      const subscriptionId = isCustomPlan ? session?.subscription : subscription?.id

      logger.info(`Subscription ID: ${subscriptionId}`)
      org.merge({ subscriptionId: subscriptionId as string })

      await org.save()
      await trx.commit()
      logger.info('Transaction fully committed')

      await emitter.emit('new:custom-user', {
        user,
        org,
        customPaymentSchedule: payload.customPaymentSchedule,
        featureList: payload.featureList,
        subscriptionId: subscriptionId as string,
        session: session,
      })

      return { user, msg: 'Account created sucessfully' }
    } catch (err) {
      logger.error({ err }, 'Error creating org account')
      await trx.rollback()
      // remove stripe customer

      return response.badRequest({
        error: err.message || 'Error creating account',
        err,
      })
    }
  }

  async show({ params, inertia, request, logger }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await Org.query({ connection: appEnv }).where('id', params.id).firstOrFail()

    let isLoopsUser = false
    const creatorEmail = org.creatorEmail?.trim()

    const loopService = new LoopService()
    try {
      const loopUser = await loopService.findUser(creatorEmail)
      isLoopsUser = Boolean(loopUser)
    } catch (error) {
      /** Loops is non-essential here; a lookup failure must not break the page. */
      logger.error({ err: error }, 'Loops user lookup failed')
    }

    return inertia.render('orgs/show', {
      org: OrgTransformer.transform(org),
      isLoopsUser,
    } as never)
  }

  async edit({ params, inertia, request }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await Org.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    return inertia.render('orgs/edit', { org: OrgTransformer.transform(org) } as never)
  }

  async update({ params, request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await Org.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    const payload = await request.validateUsing(updateOrgValidator)

    const oldSchedule = org.customPaymentSchedule as Record<string, unknown> | undefined
    const oldAmount = oldSchedule?.amount != null ? Number(oldSchedule.amount) : undefined
    const oldCurrency = oldSchedule?.currency != null ? String(oldSchedule.currency) : undefined
    const newAmount = payload.customPaymentSchedule?.amount
    const newCurrency = payload.customPaymentSchedule?.currency
    const priceChanged =
      payload.customPaymentSchedule != null &&
      (oldAmount !== newAmount || oldCurrency !== newCurrency)

    const updates: Partial<Org> = {}
    if (payload.name !== undefined) {
      const name = payload.name.trim()
      updates.name = name.endsWith('_org') ? name : `${name}_org`
    }
    updates.creatorEmail = payload.creatorEmail
    updates.companyName = payload.companyName
    updates.companyWebsite = payload.companyWebsite
    updates.companyEmail = payload.companyEmail
    updates.country = payload.country as Org['country']
    updates.ownerRole = payload.ownerRole

    updates.isWhiteLabelEnabled = payload.isWhiteLabelEnabled
    updates.customPaymentSchedule = payload.customPaymentSchedule
    updates.customPlanFeatures = payload.customPlanFeatures
    updates.pages = payload.pages as Org['pages']

    if (payload.settings !== undefined) {
      updates.settings = { ...org.settings, ...payload.settings } as Org['settings']
    }

    org.merge(updates)
    await org.save()

    if (priceChanged && org.paymentCustomerId && org.customPaymentSchedule) {
      try {
        const session = await StripeService.createPriceUpdateSession(org)
        if (session?.url) {
          const schedule = org.customPaymentSchedule as Record<string, unknown>
          const amount = Number(schedule.amount)
          const currency = String(schedule.currency ?? 'gbp')
          const fullName = (org.cleanName as string) ?? (org.companyName as string) ?? 'Customer'
          await mailer.send({
            type: 'customer-price-updated',
            data: {
              email: org.email,
              fullName,
              url: session.url,
              amount,
              currency,
            },
          })
          logger.info(`Price-updated email sent to ${org.creatorEmail} with checkout URL`)
        }
      } catch (err) {
        logger.error('Failed to create price-update session or send email', { err, orgId: org.id })
      }
    }

    return response.ok({ success: true, org })
  }

  async leases({ request, params, response }: HttpContext) {
    await request.validateUsing(paginationQueryValidator)
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()

    const leases = await Lease.query({ connection: appEnv })
      .where('org_id', params.id)
      .orderBy('start_date', 'desc')
      .preload('tenants', (q) => q.select('id', 'name', 'email'))
      .preload('org', (q) => q.select('id', 'name', 'creatorEmail'))
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)

    return response.ok(leases)
  }

  async properties({ request, params, response }: HttpContext) {
    await request.validateUsing(paginationQueryValidator)
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()
    const properties = await Property.query({ connection: appEnv })
      .where('org_id', params.id)
      .orderBy('address_line_one', 'asc')
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)
    return response.ok(properties)
  }

  async activities({ request, params, response }: HttpContext) {
    await request.validateUsing(paginationQueryValidator)
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()

    const activities = await Activity.query({ connection: appEnv })
      .where('org_id', params.id)
      .orderBy('created_at', 'desc')
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)

    return response.ok(activities)
  }

  async invoices({ params, response, request }: HttpContext) {
    const appEnv = request.appEnv()
    const stripeService = new StripeService()
    const result = await stripeService.viewInvoices(params.id, appEnv)
    const data = (result.data ?? []).map((inv: Stripe.Invoice) => ({
      id: inv.id,
      number: inv.number ?? inv.id,
      status: inv.status ?? 'unknown',
      amountPaid: inv.amount_paid ?? 0,
      amountDue: inv.amount_due ?? 0,
      total: inv.total ?? 0,
      currency: (inv.currency ?? 'gbp').toUpperCase(),
      createdAt: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      invoicePdf: inv.invoice_pdf ?? null,
    }))
    return response.ok({ data })
  }

  async createInvoice({ params, inertia, request, now }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await Org.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    const { total: activeLeasesCount } = await Lease.query({ connection: appEnv })
      .where('org_id', params.id)
      .where('status', 'active')
      .where('end_date', '>=', now.toISODate()!)
      .getCount()

    return inertia.render('orgs/invoices/create', {
      org: OrgTransformer.transform(org),
      activeLeasesCount,
    } as never)
  }

  async storeInvoice({ params, request, response, session }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await Org.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    if (!org.paymentCustomerId) {
      session.flash('errors', {
        error: 'This organisation has no Stripe customer and cannot receive invoices.',
      })
      return response.redirect().back()
    }
    const description = request.input('description')?.trim() || undefined
    const rawLineItems = request.input('lineItems') as
      | Array<{ description?: string; amount?: string; currency?: string }>
      | undefined
    const lineItems = Array.isArray(rawLineItems)
      ? (rawLineItems
          .map((row) => {
            const desc = (row?.description ?? '').toString().trim()
            const amt =
              typeof row?.amount === 'string' ? parseFloat(row.amount) : Number(row?.amount)
            const curr = (row?.currency ?? 'gbp').toString().trim().toLowerCase() || 'gbp'
            if (!desc || Number.isNaN(amt) || amt < 0) return null
            return { description: desc, amountCents: Math.round(amt * 100), currency: curr }
          })
          .filter(Boolean) as Array<{ description: string; amountCents: number; currency: string }>)
      : []

    try {
      const invoice = await StripeService.createDraftInvoice(org.paymentCustomerId, {
        description,
      })
      for (const item of lineItems) {
        await StripeService.createInvoiceItem(org.paymentCustomerId, invoice.id, {
          amount: item.amountCents,
          currency: item.currency,
          description: item.description,
        })
      }
      session.flash(
        'success',
        lineItems.length > 0
          ? 'Draft invoice created with line items. Finalize it in Stripe when ready.'
          : 'Draft invoice created. You can add line items and finalize it in Stripe.',
      )
      return response.redirect(`/orgs/${params.id}?tab=invoices`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create draft invoice.'
      session.flash('errors', { error: message })
      return response.redirect().back()
    }
  }

  async createInvoiceLineItem({ params, inertia, request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await Org.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    if (!org.paymentCustomerId) return response.notFound()

    return inertia.render('orgs/invoices/line-items/create', {
      org: OrgTransformer.transform(org),
      invoiceId: params.invoiceId,
    } as never)
  }

  async storeInvoiceLineItem({ params, request, response, session }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await Org.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    if (!org.paymentCustomerId) {
      session.flash('errors', { error: 'This organisation has no Stripe customer.' })
      return response.redirect().back()
    }
    const invoiceId = params.invoiceId as string
    const description = request.input('description')?.trim()
    const amountInput = request.input('amount')
    const amount = typeof amountInput === 'string' ? parseFloat(amountInput) : Number(amountInput)
    const currency = (request.input('currency') ?? 'gbp').toString().trim().toLowerCase() || 'gbp'

    if (!description || Number.isNaN(amount) || amount < 0) {
      session.flash('errors', { error: 'Description and a valid amount are required.' })
      return response.redirect().back()
    }
    try {
      await StripeService.createInvoiceItem(org.paymentCustomerId, invoiceId, {
        amount: Math.round(amount * 100),
        currency,
        description,
      })
      session.flash('success', 'Line item added to the draft invoice.')
      return response.redirect(`/orgs/${params.id}?tab=invoices`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add line item.'
      session.flash('errors', { error: message })
      return response.redirect().back()
    }
  }

  /** The customers list as a CSV, filtered and ordered exactly as `index` shows it. */
  async export(ctx: HttpContext) {
    await ctx.request.validateUsing(orgsExportValidator)
    const params = await ctx.request.paginationQs()
    const { baseQuery, sortBy, sortOrder } = buildOrgsListQuery(params, ctx.request.appEnv())

    /** One past the cap: `sendCsv` trims to the cap and records that it did. */
    const rows = await baseQuery.sortBy(sortBy, sortOrder).limit(MAX_EXPORT_ROWS + 1)

    return sendCsv(ctx, { name: 'orgs', rows, columns: ORG_EXPORT_COLUMNS, targetType: 'Org' })
  }
}
