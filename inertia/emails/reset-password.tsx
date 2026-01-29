import { EmailHeading, EmailText, EmailWrapper } from '#emails/layout'
import type { Emails } from '#types/mails'

function ResetPassword(props: Emails['reset-password']) {
  return (
    <EmailWrapper>
      <EmailHeading>Password Reset Successful</EmailHeading>
      <EmailText>
        Hi {props.fullName || 'there'},
      </EmailText>
      <EmailText>
        Your password has been successfully reset. If you didn't make this change, please contact
        our support team immediately.
      </EmailText>
      <EmailText>
        For security reasons, you have been logged out of all previous sessions. Please log in
        again with your new password.
      </EmailText>
    </EmailWrapper>
  )
}

export default ResetPassword
