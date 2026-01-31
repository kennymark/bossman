import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import db from '@adonisjs/lucid/services/db'
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
import OrgService from '#services/org_service'
import PermissionService from '#services/permission_service'
import StripeService from '#services/stripe_service'
import type { AppCountries } from '#types/extra'
import { createCustomerUserValidator } from '#validators/org'

export default class OrgsController {
  async index({ request, inertia }: HttpContext) {
    const params = await request.paginationQs()
    const appEnv = request.appEnv()
    const orgs = await Org.query({ connection: appEnv })

      .if(params.search, (q) => {
        q.whereILike('name', `%${params.search}%`)
      })
      .sortBy(params.sortBy || 'created_at', params.sortOrder || 'desc')

      .paginate(params.page || 1, params.perPage || 20)

    return inertia.render('orgs/index', { orgs })
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
    return inertia.render('orgs/create')
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
      return response.badRequest({ error: 'A user with this email or phone number already exists' })
    }

    try {
      const subPlan = isCustomPlan
        ? undefined
        : await SubscriptionPlan.query(trxCon)
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
        session = await StripeService.createCustomSubscription({
          customerId: customer!.id,
          data: payload.customPaymentSchedule,
          featureList: payload.featureList,
        })
        logger.info(`Custom subscription session created`)
        logger.info(`${user.name} with sub_id ${session?.subscription}`)
        logger.info(`${user.name} with session_id ${session?.id}`)
        console.log('session', session)
      } else {
        subscription = await StripeService.createSubscription({
          plan: payload.customPaymentSchedule.plan,
          frequency: payload.customPaymentSchedule.frequency,
          customerId: customer!.id,
          isTrial: payload.customPaymentSchedule.trialPeriodInDays > 0,
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
      console.log('Error creating account', err)
      await trx.rollback()
      return response.badRequest({
        error: err.message || 'Error creating account',
        err,
      })
    }
  }

  async show({ params, inertia, request }: HttpContext) {
    const appEnv = request.appEnv()
    const org = await Org.query({ connection: appEnv }).where('id', params.id).firstOrFail()

    return inertia.render('orgs/show', { org })
  }

  async leases({ request, params, response }: HttpContext) {
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
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()
    const properties = await Property.query({ connection: appEnv })
      .where('org_id', params.id)
      .orderBy('address_line_one', 'asc')
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)
    return response.ok(properties)
  }

  async activities({ request, params, response }: HttpContext) {
    const appEnv = request.appEnv()
    const paginationParams = await request.paginationQs()
    const activities = await Activity.query({ connection: appEnv })
      .where('org_id', params.id)
      .orderBy('created_at', 'desc')
      .paginate(paginationParams.page ?? 1, paginationParams.perPage ?? 10)
    return response.ok(activities)
  }
}
