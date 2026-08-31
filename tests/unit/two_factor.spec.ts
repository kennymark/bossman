import { test } from '@japa/runner'

import twoFactorService from '#services/two_factor_service'

/**
 * Recovery codes are a complete authentication bypass. They used to come from
 * `Math.random()` and sit in the database in plaintext, so these cases pin both the
 * entropy and the storage format.
 */
test.group('recovery codes', () => {
  test('are unique across a large sample', ({ assert }) => {
    const codes = Array.from({ length: 50 }, () => twoFactorService.generateRecoveryCodes(8)).flat()
    assert.equal(new Set(codes).size, codes.length)
  })

  test('have a fixed shape and no ambiguous characters', ({ assert }) => {
    for (const code of twoFactorService.generateRecoveryCodes(20)) {
      assert.match(code, /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/)
    }
  })

  test('are stored hashed, never in plaintext', ({ assert }) => {
    const codes = twoFactorService.generateRecoveryCodes(4)
    const stored = twoFactorService.hashRecoveryCodes(codes)

    for (const code of codes) {
      assert.notInclude(stored, code)
    }
    assert.lengthOf(JSON.parse(stored), 4)
  })

  test('verify against the hashed form, tolerating formatting', ({ assert }) => {
    const codes = twoFactorService.generateRecoveryCodes(3)
    const stored = twoFactorService.hashRecoveryCodes(codes)

    assert.isTrue(twoFactorService.verifyRecoveryCode(stored, codes[0]))
    assert.isTrue(twoFactorService.verifyRecoveryCode(stored, codes[0].toLowerCase()))
    assert.isTrue(twoFactorService.verifyRecoveryCode(stored, codes[0].replace(/-/g, '')))
    assert.isFalse(twoFactorService.verifyRecoveryCode(stored, 'AAAA-BBBB-CCCC-DDDD'))
    assert.isFalse(twoFactorService.verifyRecoveryCode(stored, ''))
    assert.isFalse(twoFactorService.verifyRecoveryCode(null, codes[0]))
  })

  test('are single use', ({ assert }) => {
    const codes = twoFactorService.generateRecoveryCodes(3)
    let stored = twoFactorService.hashRecoveryCodes(codes)

    stored = twoFactorService.removeRecoveryCode(stored, codes[0])

    assert.isFalse(twoFactorService.verifyRecoveryCode(stored, codes[0]))
    assert.isTrue(twoFactorService.verifyRecoveryCode(stored, codes[1]))
    assert.equal(twoFactorService.countRecoveryCodes(stored), 2)
  })

  /**
   * Rows written before hashing existed hold comma-separated plaintext. They have to
   * keep working, and consuming one has to migrate the rest.
   */
  test('accept legacy plaintext codes and migrate them on use', ({ assert }) => {
    const legacy = 'ABCD1234,EFGH5678,IJKL9012'

    assert.isTrue(twoFactorService.verifyRecoveryCode(legacy, 'ABCD1234'))
    assert.isTrue(twoFactorService.verifyRecoveryCode(legacy, 'abcd1234'))
    assert.equal(twoFactorService.countRecoveryCodes(legacy), 3)

    const migrated = twoFactorService.removeRecoveryCode(legacy, 'ABCD1234')

    assert.isFalse(twoFactorService.verifyRecoveryCode(migrated, 'ABCD1234'))
    assert.isTrue(twoFactorService.verifyRecoveryCode(migrated, 'EFGH5678'))
    /** Written back hashed, so the plaintext is gone. */
    assert.notInclude(migrated, 'EFGH5678')
    assert.lengthOf(JSON.parse(migrated), 2)
  })
})

test.group('totp secrets', () => {
  test('round-trip through encryption', ({ assert }) => {
    const secret = twoFactorService.generateSecret('admin@example.com')
    const encrypted = twoFactorService.encryptSecret(secret.base32!)

    assert.notEqual(encrypted, secret.base32)
    assert.equal(twoFactorService.decryptSecret(encrypted), secret.base32)
    assert.isFalse(twoFactorService.secretNeedsMigration(encrypted))
  })

  test('still read a pre-encryption plaintext secret', ({ assert }) => {
    const legacy = 'JBSWY3DPEHPK3PXP'

    assert.equal(twoFactorService.decryptSecret(legacy), legacy)
    assert.isTrue(twoFactorService.secretNeedsMigration(legacy))
  })

  test('reject an empty token or secret rather than throwing', ({ assert }) => {
    assert.isFalse(twoFactorService.verifyToken('', '123456'))
    assert.isFalse(twoFactorService.verifyToken('JBSWY3DPEHPK3PXP', ''))
  })
})
