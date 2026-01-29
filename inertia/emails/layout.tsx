import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components'
import type React from 'react'
import { appUrl } from '#emails/global'
import { baseStyles, footerStyles, mergeStyles } from '#emails/styles'

interface EmailWrapperProps {
  children: React.ReactNode
  style?: React.CSSProperties
  noFooterMargin?: boolean
}

// Reusable components
export function EmailWrapper({ children, style, noFooterMargin = false }: EmailWrapperProps) {
  return (
    <Html lang='en'>
      <Head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,200..800&display=swap'
          rel='stylesheet'
        />
      </Head>
      <Body style={baseStyles.body}>
        <Container style={mergeStyles(baseStyles.baseContainer, style)}>
          {/* <Logo /> */}
          {children}

        </Container>
      </Body>
    </Html>
  )
}



export function EmailSignature() {
  return (
    <EmailContainer
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginTop: '20px',
      }}>
      <EmailText style={{ marginBottom: '0px', margin: '0px' }}>Best regards,</EmailText>
      <EmailText style={{ marginBottom: '0px', margin: '0px' }}>The ilemi Team</EmailText>
    </EmailContainer>
  )
}

export function EmailContainer({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return <Container style={style}>{children}</Container>
}

export function EmailHeading({
  children,
  style,
  compact = false,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  compact?: boolean
}) {
  return (
    <Heading
      style={mergeStyles(baseStyles.heading, {
        ...style,
        ...(compact ? { margin: 0, marginBottom: 0 } : {}),
      })}>
      {children}
    </Heading>
  )
}

export function EmailSubheading({
  children,
  style,
  compact = false,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  compact?: boolean
}) {
  return (
    <Heading
      style={mergeStyles(baseStyles.subheading, {
        ...style,
        ...(compact ? { margin: 0, marginBottom: 0 } : {}),
      })}>
      {children}
    </Heading>
  )
}

export function EmailText({
  children,
  style,
  compact = false,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  compact?: boolean
}) {
  return (
    <Text
      style={mergeStyles(baseStyles.text, {
        ...style,
        ...(compact ? { marginTop: 0 } : {}),
      })}>
      {children}
    </Text>
  )
}

export function EmailLink({
  href,
  children,
  style,
}: {
  href: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <Link href={href} style={mergeStyles(baseStyles.link, style)}>
      {children}
    </Link>
  )
}

export function EmailButton({
  href,
  children,
  style,
}: {
  href: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <Button href={href} style={mergeStyles(baseStyles.button, style)}>
      {children}
    </Button>
  )
}

export function EmailHr({ style }: { style?: React.CSSProperties }) {
  return <Hr style={mergeStyles(baseStyles.hr, style)} />
}

export function EmailImg({
  src,
  alt,
  style,
}: {
  src: string
  alt: string
  style?: React.CSSProperties
}) {
  return <Img src={src} alt={alt} style={mergeStyles(baseStyles.image, style)} />
}

export function EmailList({
  items,
  ordered = false,
  style,
  children,
}: {
  items?: string[]
  children?: React.ReactNode
  ordered?: boolean
  style?: React.CSSProperties
}) {
  const ListComponent = ordered ? 'ol' : 'ul'
  return (
    <ListComponent style={mergeStyles(baseStyles.list, style)}>
      {items
        ? items.map((item, index) => (
          <li key={index.toString()} style={baseStyles.listItem}>
            {item}
          </li>
        ))
        : children}
    </ListComponent>
  )
}

export function EmailListItem({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return <li style={mergeStyles(baseStyles.listItem, style)}>{children}</li>
}

export function EmailSection({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return <Section style={mergeStyles(baseStyles.section, style)}>{children}</Section>
}

export function EmailColumn({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return <Column style={mergeStyles(baseStyles.column, style)}>{children}</Column>
}

export function EmailRow({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return <Row style={style}>{children}</Row>
}

export default {
  EmailWrapper,
  EmailContainer,
  EmailHeading,
  EmailText,
  EmailLink,
  EmailButton,
  EmailHr,
  EmailImg,
  EmailList,
  EmailSection,
  EmailColumn,
  EmailRow,
}
