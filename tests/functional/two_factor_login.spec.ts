import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import speakeasy from 'speakeasy'

import User from '#models/user'
import twoFactorService from '#services/two_factor_service'

/**
 * The 2FA login gate.
 *
 * Before this existed, `POST /auth/login` called `auth.login()` as soon as the password
 * checked out and the 2FA endpoints all sat behind `auth()` — so an account with 2FA
 * enabled was still protected by nothing but its password. These cases pin the two-step
 * flow so that cannot regress.
 */
test.group('Two-factor login', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  })

  /** Creates a user with 2FA on, returning the plaintext secret and recovery codes. */
  async function createUserWithTwoFactor(email: string) {
    const secret = speakeasy.generateSecret({ length: 32 })
    const recoveryCodes = twoFactorService.generateRecoveryCodes(4)

    const user = await User.create({
      fullName: 'Two Factor',
      email,
      password: 'password123',
      role: 'admin',
      twoFactorEnabled: true,
      twoFactorSecret: twoFactorService.encryptSecret(secret.base32),
      twoFactorRecoveryCodes: twoFactorService.hashRecoveryCodes(recoveryCodes),
    })

    return { user, secret: secret.base32, recoveryCodes }
  }

  function currentToken(secret: string) {
    return speakeasy.totp({ secret, encoding: 'base32' })
  }

  test('password alone does not sign a 2FA user in', async ({ client, assert }) => {
    await createUserWithTwoFactor('twofa-gate@example.com')

    const response = await client
      .post('/api/v1/auth/login')
      .json({ email: 'twofa-gate@example.com', password: 'password123' })
      .withCsrfToken()

    response.assertStatus(200)
    response.assertBodyContains({ data: { requiresTwoFactor: true } })
    /** No user is returned, because no session was created. */
    assert.notProperty(response.body().data, 'user')
  })

  test('the session is not authenticated until the code is given', async ({ client }) => {
    await createUserWithTwoFactor('twofa-session@example.com')

    const login = await client
      .post('/api/v1/auth/login')
      .json({ email: 'twofa-session@example.com', password: 'password123' })
      .withCsrfToken()

    /** Carrying the login's cookies must not grant access to an authenticated route. */
    const probe = await client.get('/api/v1/user/settings').withSession(login.session())
    probe.assertStatus(401)
  })

  test('a valid TOTP code completes the login', async ({ client }) => {
    const { secret } = await createUserWithTwoFactor('twofa-ok@example.com')

    const login = await client
      .post('/api/v1/auth/login')
      .json({ email: 'twofa-ok@example.com', password: 'password123' })
      .withCsrfToken()

    const response = await client
      .post('/api/v1/auth/2fa/challenge')
      .json({ token: currentToken(secret) })
      .withSession(login.session())
      .withCsrfToken()

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Login successful' })
    response.assertBodyContains({ data: { user: { email: 'twofa-ok@example.com' } } })
  })

  test('a wrong code does not complete the login', async ({ client }) => {
    await createUserWithTwoFactor('twofa-bad@example.com')

    const login = await client
      .post('/api/v1/auth/login')
      .json({ email: 'twofa-bad@example.com', password: 'password123' })
      .withCsrfToken()

    const response = await client
      .post('/api/v1/auth/2fa/challenge')
      .json({ token: '000000' })
      .withSession(login.session())
      .withCsrfToken()

    response.assertStatus(400)
  })

  test('the challenge endpoint refuses a request with no pending login', async ({ client }) => {
    const response = await client
      .post('/api/v1/auth/2fa/challenge')
      .json({ token: '123456' })
      .withCsrfToken()

    response.assertStatus(401)
    response.assertBodyContains({ type: 'challenge_expired' })
  })

  test('a recovery code completes the login and is then spent', async ({ client }) => {
    const { recoveryCodes } = await createUserWithTwoFactor('twofa-recovery@example.com')

    const login = await client
      .post('/api/v1/auth/login')
      .json({ email: 'twofa-recovery@example.com', password: 'password123' })
      .withCsrfToken()

    const first = await client
      .post('/api/v1/auth/2fa/challenge')
      .json({ recoveryCode: recoveryCodes[0] })
      .withSession(login.session())
      .withCsrfToken()

    first.assertStatus(200)
    first.assertBodyContains({ data: { recoveryCodesRemaining: 3 } })

    /** The same code must not work twice. */
    const secondLogin = await client
      .post('/api/v1/auth/login')
      .json({ email: 'twofa-recovery@example.com', password: 'password123' })
      .withCsrfToken()

    const reuse = await client
      .post('/api/v1/auth/2fa/challenge')
      .json({ recoveryCode: recoveryCodes[0] })
      .withSession(secondLogin.session())
      .withCsrfToken()

    reuse.assertStatus(400)
  })

  test('a user without 2FA still logs in in one step', async ({ client }) => {
    await User.create({
      fullName: 'No Two Factor',
      email: 'no-twofa@example.com',
      password: 'password123',
      role: 'admin',
    })

    const response = await client
      .post('/api/v1/auth/login')
      .json({ email: 'no-twofa@example.com', password: 'password123' })
      .withCsrfToken()

    response.assertStatus(200)
    response.assertBodyContains({ data: { user: { email: 'no-twofa@example.com' } } })
  })
})
