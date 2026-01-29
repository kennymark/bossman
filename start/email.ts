import { render } from '@react-email/components'

import mailer from '#services/email_service'
import env from '#start/env'

mailer.on({
  type: 'simple-send',
  handler: async (message, data) => {
    const { email, subject, replyTo, from } = data
    const SimpleSend = await import('#emails/simple-send').then((m) => m.default)
    const html = await render(SimpleSend(data))
    message
      .from(from ?? '')
      .subject(subject)
      .to(email)
      .html(html)
      .replyTo(replyTo ?? '')
  },
})

mailer.on({
  type: 'verify-email',
  handler: async (message, data) => {
    const VerifyEmail = await import('#emails/verify-email').then((m) => m.default)
    const html = await render(VerifyEmail(data))

    message
      .from(env.get('NO_REPLY_EMAIL', 'noreply@example.com'))
      .subject('Verify Your Email Address')
      .to(data.email)
      .html(html)
      .replyTo(env.get('FROM_EMAIL', 'hello@example.com'))
  },
})

mailer.on({
  type: 'forgot-password',
  handler: async (message, data) => {
    const ForgotPassword = await import('#emails/forgot-password').then((m) => m.default)
    const html = await render(ForgotPassword(data))
    message
      .from(env.get('NO_REPLY_EMAIL', 'noreply@example.com'))
      .subject('Reset Your Password')
      .to(data.email)
      .html(html)
      .replyTo(env.get('FROM_EMAIL', 'hello@example.com'))
  },
})

mailer.on({
  type: 'reset-password',
  handler: async (message, data) => {
    const ResetPassword = await import('#emails/reset-password').then((m) => m.default)
    const html = await render(ResetPassword(data))
    message
      .from(env.get('NO_REPLY_EMAIL', 'noreply@example.com'))
      .subject('Password Reset Successful')
      .to(data.email)
      .html(html)
      .replyTo(env.get('FROM_EMAIL', 'hello@example.com'))
  },
})

mailer.on({
  type: 'verify-email-change',
  handler: async (message, data) => {
    const VerifyEmailChange = await import('#emails/verify-email-change').then((m) => m.default)
    const html = await render(VerifyEmailChange(data))

    message
      .subject('Confirm Your New Email Address')
      .to(data.email)
      .html(html)
      .replyTo(env.get('FROM_EMAIL', 'hello@example.com'))
  },
})

mailer.on({
  type: 'welcome',
  handler: async (message, data) => {
    const Welcome = await import('#emails/welcome').then((m) => m.default)
    const html = await render(Welcome(data))
    message
      .subject('Welcome to Starter!')
      .to(data.email)
      .html(html)
      .replyTo(env.get('FROM_EMAIL', 'hello@example.com'))
  },
})

mailer.on({
  type: 'contact-form',
  handler: async (message, data) => {
    const ContactForm = await import('#emails/contact-form').then((m) => m.default)
    const html = await render(ContactForm(data))
    message
      .subject(`Contact Form: ${data.subject}`)
      .to(env.get('FROM_EMAIL', 'hello@example.com'))
      .html(html)
      .replyTo(data.email)
  },
})

mailer.on({
  type: 'goodbye',
  handler: async (message, data) => {
    const Goodbye = await import('#emails/goodbye').then((m) => m.default)
    const html = await render(Goodbye(data))
    message
      .subject("We're Sorry to See You Go")
      .to(data.email)
      .html(html)
      .replyTo(env.get('FROM_EMAIL', 'hello@example.com'))
  },
})

mailer.on({
  type: 'password-changed',
  handler: async (message, data) => {
    const PasswordChanged = await import('#emails/password-changed').then((m) => m.default)
    const html = await render(PasswordChanged(data))
    message
      .subject('Password Changed Successfully')
      .to(data.email)
      .html(html)
      .replyTo(env.get('FROM_EMAIL', 'hello@example.com'))
  },
})

mailer.on({
  type: 'team-invite',
  handler: async (message, data) => {
    const TeamInvite = await import('#emails/team-invite').then((m) => m.default)
    const html = await render(TeamInvite(data))
    message
      .subject(`You’ve been invited to join ${data.teamName}`)
      .to(data.email)
      .html(html)
      .replyTo(env.get('FROM_EMAIL', 'hello@example.com'))
  },
})

mailer.on({
  type: 'team-joined',
  handler: async (message, data) => {
    const TeamJoined = await import('#emails/team-joined').then((m) => m.default)
    const html = await render(TeamJoined(data))
    message
      .subject(`${data.joinedUserName} joined ${data.teamName}`)
      .to(data.email)
      .html(html)
      .replyTo(env.get('FROM_EMAIL', 'hello@example.com'))
  },
})
