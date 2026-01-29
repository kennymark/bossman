import { Html } from '@react-email/components'
import type { Emails } from '#types/mails'
import { EmailHeading, EmailSignature, EmailText, EmailWrapper } from './layout.js'

function SimpleSend(props: Emails['simple-send']) {
  return (
    <EmailWrapper>
      {props.subject && <EmailHeading>{props.subject}</EmailHeading>}

      {props.name && <EmailText>{props.name}</EmailText>}

      {props.body && <Html dangerouslySetInnerHTML={{ __html: props.body }} />}
      <EmailSignature />
    </EmailWrapper>
  )
}

export default SimpleSend
