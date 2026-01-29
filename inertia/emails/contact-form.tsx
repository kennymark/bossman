import { EmailHeading, EmailText, EmailWrapper } from '#emails/layout'

interface ContactFormProps {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactForm(props: ContactFormProps) {
  return (
    <EmailWrapper>
      <EmailHeading>New Contact Form Submission</EmailHeading>
      <EmailText>
        <strong>Name:</strong> {props.name}
      </EmailText>
      <EmailText>
        <strong>Email:</strong> {props.email}
      </EmailText>
      <EmailText>
        <strong>Subject:</strong> {props.subject}
      </EmailText>
      <EmailText>
        <strong>Message:</strong>
      </EmailText>
      <EmailText>{props.message}</EmailText>
    </EmailWrapper>
  )
}
