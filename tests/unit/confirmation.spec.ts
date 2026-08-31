import { test } from '@japa/runner'

import {
  CONFIRMATION_PHRASES,
  confirmationMatches,
  normaliseConfirmation,
  reasonIsValid,
} from '#utils/confirmation'

/**
 * Typed confirmation is the last thing between a mis-click and an overwritten
 * production database, so it has to be forgiving about formatting and strict about
 * content.
 */
test.group('confirmation phrases', () => {
  test('ignores case and surrounding whitespace', ({ assert }) => {
    assert.isTrue(confirmationMatches('  Restore PROD ', 'restore prod'))
    assert.isTrue(confirmationMatches('restore   prod', 'restore prod'))
  })

  test('rejects anything that is not the phrase', ({ assert }) => {
    assert.isFalse(confirmationMatches('restore dev', 'restore prod'))
    assert.isFalse(confirmationMatches('', 'restore prod'))
    assert.isFalse(confirmationMatches(undefined, 'restore prod'))
    assert.isFalse(confirmationMatches(null, 'restore prod'))
    assert.isFalse(confirmationMatches(42, 'restore prod'))
  })

  test('names the target so one dialog cannot confirm another', ({ assert }) => {
    const prod = CONFIRMATION_PHRASES['backup.restore']('prod')
    const dev = CONFIRMATION_PHRASES['backup.restore']('dev')

    assert.notEqual(prod, dev)
    assert.isFalse(confirmationMatches(dev, prod))
  })

  test('bulk phrases name the affected count', ({ assert }) => {
    assert.isFalse(
      confirmationMatches(CONFIRMATION_PHRASES['org.bulk'](3), CONFIRMATION_PHRASES['org.bulk'](4)),
    )
  })

  test('normalises consistently', ({ assert }) => {
    assert.equal(normaliseConfirmation('  BAN   Acme  Ltd '), 'ban acme ltd')
    assert.equal(normaliseConfirmation(undefined), '')
  })
})

test.group('reason validation', () => {
  test('requires something worth reading', ({ assert }) => {
    assert.isFalse(reasonIsValid(''))
    assert.isFalse(reasonIsValid('x'))
    assert.isFalse(reasonIsValid('   spaces  '))
    assert.isFalse(reasonIsValid(undefined))
  })

  test('accepts a real explanation and caps the length', ({ assert }) => {
    assert.isTrue(reasonIsValid('Fraudulent chargebacks reported by finance'))
    assert.isFalse(reasonIsValid('a'.repeat(501)))
  })
})
