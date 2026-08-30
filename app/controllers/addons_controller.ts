import type { HttpContext } from '@adonisjs/core/http'

import Addon from '#models/addon'
import StripeService from '#services/stripe_service'
import AddonTransformer from '#transformers/addon_transformer'
import { renderInertia } from '#utils/inertia'
import { createAddonValidator, updateAddonValidator } from '#validators/addon'

export default class AddonsController {
  async index({ inertia, request }: HttpContext) {
    const env = request.appEnv()
    const addons = await Addon.query({ connection: env })
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')

    return renderInertia(inertia, 'addons/index', {
      addons: AddonTransformer.transform(addons),
    })
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('addons/create', {})
  }

  async store({ request, response }: HttpContext) {
    const env = request.appEnv()
    const payload = await request.validateUsing(createAddonValidator)
    const price = await StripeService.createPrice(
      {
        currency: payload.priceCurrency,
        unit_amount: Number(payload.priceAmount) * 100,
        nickname: payload.name,
        ...(payload.billingType === 'one_off'
          ? {}
          : {
              recurring: {
                interval: payload.billingType === 'recurring_monthly' ? 'month' : 'year',
              },
            }),
      },
      env,
    )
    await Addon.create({ ...payload, stripePriceId: price.id }, { connection: env })

    return response.redirect(`/addons`)
  }

  async edit({ params, request, inertia, response }: HttpContext) {
    const env = request.appEnv()
    const addon = await Addon.find(params.id, { connection: env })
    if (!addon) return response.notFound()
    return inertia.render('addons/edit', {
      addon: AddonTransformer.transform(addon) as never,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const env = request.appEnv()
    const addon = await Addon.find(params.id, { connection: env })
    if (!addon) return response.notFound()

    const payload = await request.validateUsing(updateAddonValidator)
    await addon.merge(payload).save()

    return response.redirect(`/addons`)
  }
}
