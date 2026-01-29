import { EmailHeading, EmailText, EmailWrapper } from '#emails/layout'
import type { Emails } from '#types/mails'

function PasswordChanged(props: Emails['password-changed']) {
  return (
    <EmailWrapper>
      <EmailHeading>Password Changed Successfully</EmailHeading>
      <EmailText>
        Hi {props.fullName || 'there'},
      </EmailText>
      <EmailText>
        This is to confirm that your password was successfully changed. If you didn't make this
        change, please contact our support team immediately and secure your account.
      </EmailText>
      <EmailText>
        For your security, we recommend that you:
      </EmailText>
      <EmailText>
        • Use a strong, unique password<br />
        • Enable two-factor authentication if available<br />
        • Review your account activity regularly
      </EmailText>
      <EmailText>
        If you have any concerns about your account security, please don't hesitate to reach out to
        us.
      </EmailText>
      <EmailText>
        Best regards,<br />The Team
      </EmailText>
    </EmailWrapper>
  )
}

export default PasswordChanged
