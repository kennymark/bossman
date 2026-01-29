import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        fullName: 'Admin User',
        email: 'admin@test.com',
        password: 'password',
        role: 'admin',
      },
      {
        fullName: 'Regular Admin',
        email: 'regular@test.com',
        password: 'password',
        role: 'admin',
      },
      {
        fullName: 'Guest Admin',
        password: 'password',
        email: 'guest@test.com',
        role: 'admin',
      },
    ])
  }
}
