import { EmailButton, EmailHeading, EmailLink, EmailText, EmailWrapper } from '#emails/layout'
import type { Emails } from '#types/mails'
import { appUrl } from '#emails/global'

function ForgotPassword(props: Emails['forgot-password']) {
  const resetUrl = `${appUrl}/reset-password?token=${props.token}`

  return (
    <EmailWrapper>
      <EmailHeading>Reset Your Password</EmailHeading>
      <EmailText>
        Hi {props.fullName || 'there'},
      </EmailText>
      <EmailText>
        We received a request to reset your password. Click the button below to create a new
        password.
      </EmailText>
      <EmailButton href={resetUrl}>Reset Password</EmailButton>
      <EmailText>
        This link will expire in 1 hour. If you didn't request a password reset, you can safely
        ignore this email.
      </EmailText>
      <EmailText>
        If the button doesn't work, you can copy and paste this link into your browser:
      </EmailText>
      <EmailLink href={resetUrl}>{resetUrl}</EmailLink>
    </EmailWrapper>
  )
}

export default ForgotPassword
