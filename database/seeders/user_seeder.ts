import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        fullName: 'Kenny',
        email: 'kenneth@togetha.co.uk',
        password: 'password',
        role: 'super_admin',
        isGodAdmin: true,
        emailVerified: true,
        emailVerifiedAt: DateTime.now(),
      },
      {
        fullName: 'Tolu',
        email: 'tolulope@togetha.co.uk',
        password: 'password',
        role: 'admin',
        emailVerified: true,
        emailVerifiedAt: DateTime.now(),
      },
    ])
  }
}
