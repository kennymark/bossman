import { EmailHeading, EmailText, EmailWrapper } from '#emails/layout'
import type { Emails } from '#types/mails'

function Welcome(props: Emails['welcome']) {
  return (
    <EmailWrapper>
      <EmailHeading>Welcome to Starter!</EmailHeading>
      <EmailText>
        Hi {props.fullName || 'there'},
      </EmailText>
      <EmailText>
        We're thrilled to have you join us! Your account has been successfully created and you're
        all set to get started.
      </EmailText>
      <EmailText>
        If you have any questions or need help, feel free to reach out to our support team. We're
        here to help!
      </EmailText>
      <EmailText>Welcome aboard!</EmailText>
    </EmailWrapper>
  )
}

export default Welcome
