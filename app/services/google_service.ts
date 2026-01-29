import { type Attachment, attachmentManager } from '@jrmc/adonis-attachment'
import User from '#models/user'
import type { GoogleUser } from '#types/guser'
import { generateShortId } from './app.functions.js'

export class GoogleService {
  // Your code here
  public async createOrLoginWithGoogle(gUser: GoogleUser) {
    const currentUser = await User.query().where({ email: gUser.email }).first()

    const newPassword = generateShortId(32)

    if (!currentUser) {
      const newUser = await User.create({
        fullName: gUser.name,
        email: gUser.email,
        password: newPassword,
        avatar: gUser.avatarUrl
          ? ((await attachmentManager.createFromUrl(new URL(gUser.avatarUrl))) as Attachment)
          : null,
      })

      return newUser
    }

    return currentUser
    // Your code here
  }
}
