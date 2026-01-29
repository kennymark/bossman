declare module '@adonisjs/core/types' {
  interface Emails {
    'new:custom-user': {
      userId: string
    }
    'forgot-password': {
      email: string
      fullName: string
      token: string
    }
    'reset-password': {
      email: string
      fullName: string
      url?: string
    }
    'simple-send': {
      subject: string
      email: string
      body: string
      from?: string
      replyTo?: string
      name?: string
    }
    'contact-form': {
      name: string
      email: string
      subject: string
      message: string
    }
    'verify-email': {
      email: string
      fullName: string
      url: string
    }
    'verify-email-change': {
      email: string
      fullName: string
      url: string
    }
    welcome: {
      email: string
      fullName: string
    }
    goodbye: {
      email: string
      fullName: string
    }
    'password-changed': {
      email: string
      fullName: string
    }
    'team-invite': {
      email: string
      inviterName: string
      teamName: string
      url: string
    }
    'team-joined': {
      email: string
      inviterName: string
      teamName: string
      joinedUserEmail: string
      joinedUserName: string
    }
  }
}
