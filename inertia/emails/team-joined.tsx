import { EmailHeading, EmailText, EmailWrapper } from '#emails/layout'
import type { Emails } from '#types/mails'

function TeamJoined(props: Emails['team-joined']) {
  return (
    <EmailWrapper>
      <EmailHeading>Someone joined {props.teamName}</EmailHeading>
      <EmailText>
        Hi {props.inviterName || 'there'},
      </EmailText>
      <EmailText>
        <strong>{props.joinedUserName}</strong> ({props.joinedUserEmail}) accepted your invite and joined{' '}
        <strong>{props.teamName}</strong>.
      </EmailText>
    </EmailWrapper>
  )
}

export default TeamJoined

