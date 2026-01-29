import { EmailHeading, EmailText, EmailWrapper } from '#emails/layout'
import type { Emails } from '#types/mails'

function Goodbye(props: Emails['goodbye']) {
  return (
    <EmailWrapper>
      <EmailHeading>We're Sorry to See You Go</EmailHeading>
      <EmailText>
        Hi {props.fullName || 'there'},
      </EmailText>
      <EmailText>
        We're sorry to see you leave. Your account has been successfully deleted and all your data
        has been permanently removed from our servers.
      </EmailText>
      <EmailText>
        If you change your mind in the future, we'd be happy to welcome you back. If you have any
        feedback about your experience or suggestions for how we could improve, please don't
        hesitate to reach out to us.
      </EmailText>
      <EmailText>
        Thank you for being part of our community. We wish you all the best!
      </EmailText>
      <EmailText>Best regards,<br />The Team</EmailText>
    </EmailWrapper>
  )
}

export default Goodbye
