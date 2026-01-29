import { EmailButton, EmailHeading, EmailLink, EmailText, EmailWrapper } from '#emails/layout'
import type { Emails } from '#types/mails'

function VerifyEmail(props: Emails['verify-email']) {
  return (
    <EmailWrapper>
      <EmailHeading>Verify Your Email Address</EmailHeading>
      <EmailText>
        Hi {props.fullName || 'there'},
      </EmailText>
      <EmailText>
        Thank you for signing up! Please verify your email address by clicking the button below.
      </EmailText>
      <EmailButton href={props.url}>Verify Email</EmailButton>
      <EmailText>
        This verification link will expire in 24 hours. If you didn't create an account, you can
        safely ignore this email.
      </EmailText>
      <EmailText>
        If the button doesn't work, you can copy and paste this link into your browser:
      </EmailText>
      <EmailLink href={props.url}>{props.url}</EmailLink>
    </EmailWrapper>
  )
}

export default VerifyEmail
