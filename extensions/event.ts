import type User from '#models/user'

declare module '@adonisjs/core/types' {
  interface EventsList {
    'user:created': {
      user: User
      token: string
    }
    'user:deleted': {
      user: User
    }
  }
}
