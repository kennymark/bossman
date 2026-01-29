import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import User from '#models/user'

test.group('User Model', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    group.each.setup(() => testUtils.db().withGlobalTransaction())
  })

  test('should hash user password when creating a new user', async ({ assert }) => {
    const user = new User()
    user.fullName = 'John Doe'
    user.email = 'john-hash-create@example.com'
    user.password = 'secret123'

    await user.save()

    assert.isTrue(hash.isValidHash(user.password))
    assert.isTrue(await hash.verify(user.password, 'secret123'))
  })

  test('should hash user password when updating password', async ({ assert }) => {
    const user = await User.create({
      fullName: 'John Doe',
      email: 'john-hash-update@example.com',
      password: 'oldpassword',
    })

    const oldPasswordHash = user.password
    user.password = 'newpassword'
    await user.save()

    assert.notEqual(user.password, oldPasswordHash)
    assert.isTrue(hash.isValidHash(user.password))
    assert.isTrue(await hash.verify(user.password, 'newpassword'))
  })

  test('should verify credentials correctly', async ({ assert }) => {
    const user = await User.create({
      fullName: 'John Doe',
      email: 'john-verify@example.com',
      password: 'secret123',
    })

    const verifiedUser = await User.verifyCredentials('john-verify@example.com', 'secret123')
    assert.instanceOf(verifiedUser, User)
    assert.equal(verifiedUser.id, user.id)
  })

  test('should throw error for invalid credentials', async ({ assert }) => {
    await User.create({
      fullName: 'John Doe',
      email: 'john-invalid-creds@example.com',
      password: 'secret123',
    })

    await assert.rejects(async () => {
      await User.verifyCredentials('john-invalid-creds@example.com', 'wrongpassword')
    }, 'Invalid user credentials')
  })

  test('should throw error for non-existent user', async ({ assert }) => {
    await assert.rejects(async () => {
      await User.verifyCredentials('nonexistent@example.com', 'password')
    }, 'Invalid user credentials')
  })
})
