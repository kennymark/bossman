import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import mailer from '#services/email_service'

const contactValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(255),
    email: vine.string().toLowerCase().trim().email(),
    subject: vine.string().minLength(3).maxLength(255),
    message: vine.string().minLength(10).maxLength(2000),
  }),
)

export default class ContactController {
  async send({ request, response, logger }: HttpContext) {
    const body = await request.validateUsing(contactValidator)

    // Log the contact form submission
    logger.info('Contact form submission', body)

    // Send email notification
    try {
      await mailer.send({ type: 'contact-form', data: body })
      return response.ok({ message: 'Thank you for your message. We will get back to you soon.' })
    } catch (error) {
      logger.error('Error sending contact form email', error)
      // Still return success to user, but log the error
      return response.ok({
        message: 'Thank you for your message. We will get back to you soon.',
      })
    }
  }
}
