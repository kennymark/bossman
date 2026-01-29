import {
  EmailButton,
  EmailHeading,
  EmailLink,
  EmailText,
  EmailWrapper,
} from '#emails/layout'
import type { Emails } from '#types/mails'

function VerifyEmailChange(props: Emails['verify-email-change']) {
  return (
    <EmailWrapper>
      <EmailHeading>Confirm Your New Email Address</EmailHeading>
      <EmailText>Hi {props.fullName || 'there'},</EmailText>
      <EmailText>
        You requested to change your email address. Please confirm this change by clicking the
        button below.
      </EmailText>
      <EmailButton href={props.url}>Confirm Email Change</EmailButton>
      <EmailText>
        This confirmation link will expire in 24 hours. If you didn't request this change, you can
        safely ignore this email and your email address will remain unchanged.
      </EmailText>
      <EmailText>
        If the button doesn't work, you can copy and paste this link into your browser:
      </EmailText>
      <EmailLink href={props.url}>{props.url}</EmailLink>
    </EmailWrapper>
  )
}

export default VerifyEmailChange
