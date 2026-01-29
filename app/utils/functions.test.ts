import { test } from '@japa/runner'
import pluralize from 'pluralize'
import {
  // calculatePerformance,
  convertBytesToMb,
  formatCurrency,
  formatFileSize,
  generateArrayFromNumber,
  generateOTP,
  generateTogethaReference,
  ordinalize,
  rentBreakdown,
  runIfFalse,
  runIfTrue,
  startCase,
  trimSymbols,
  waitFor,
} from './functions.js'

test.group('Utility Functions', () => {
  test('convertBytesToMb', ({ assert }) => {
    assert.equal(convertBytesToMb(1048576), '1.00')
    assert.equal(convertBytesToMb(2097152), '2.00')
  })

  test('startCase', ({ assert }) => {
    assert.equal(startCase('helloWorld'), 'Hello World')
    assert.equal(startCase('hello-world'), 'Hello World')
    assert.equal(startCase('hello_world'), 'Hello World')
    assert.equal(startCase(), '')
  })

  test('formatFileSize', ({ assert }) => {
    assert.equal(formatFileSize(500), '500 KB')
    assert.equal(formatFileSize(1500), '1.50 KB')
    assert.equal(formatFileSize(1500000), '1.50 MB')
  })

  test('generateTogethaReference', ({ assert }) => {
    const date = new Date('2023-05-15')
    const originalDateNow = Date.now
    Date.now = () => date.getTime()

    assert.equal(generateTogethaReference('John Doe', true), 'tog-jo-52023-oe-DE')
    assert.equal(generateTogethaReference('Jane Smith', false), 'tog-ja-52023-th-RE')

    Date.now = originalDateNow
  })

  test('rentBreakdown', ({ assert }) => {
    const result = rentBreakdown(1000, 'monthly')
    assert.properties(result, [
      'dailyRent',
      'weeklyRent',
      'monthlyRent',
      'yearlyRent',
      'actualAmount',
    ])
    assert.approximately(result.dailyRent, 32.85, 0.01)
    assert.approximately(result.weeklyRent, 229.96, 0.01)
    assert.equal(result.monthlyRent, 1000)
    assert.equal(result.yearlyRent, 12000)
    assert.equal(result.actualAmount, 1000)

    assert.throws(() => rentBreakdown(1000, 'invalid' as any), 'Invalid frequency: invalid')
  })

  test('formatCurrency', ({ assert }) => {
    assert.equal(formatCurrency(1000), '£1,000.00')
    assert.equal(formatCurrency(1000.5), '£1,000.50')
    assert.equal(formatCurrency(1000, 'USD'), '$1,000.00')
  })

  test('pluralize', ({ assert }) => {
    assert.equal(pluralize('apple', 1), 'apple')
    assert.equal(pluralize('apple', 2), 'apples')
  })

  test('waitFor', async ({ assert }) => {
    const start = Date.now()
    await waitFor(100)
    const end = Date.now()
    assert.isAtLeast(end - start, 100)
  })

  test('ordinalize', ({ assert }) => {
    assert.equal(ordinalize(1), '1st')
    assert.equal(ordinalize(2), '2nd')
    assert.equal(ordinalize(3), '3rd')
    assert.equal(ordinalize(4), '4th')
    assert.equal(ordinalize(11), '11th')
    assert.equal(ordinalize(21), '21st')
  })

  test('trimSymbols', ({ assert }) => {
    assert.equal(trimSymbols('hello_world-test?'), 'helloworldtest')
  })

  test('generateArrayFromNumber', ({ assert }) => {
    assert.deepEqual(generateArrayFromNumber(5), [1, 2, 3, 4, 5])
  })

  test('runIfTrue', async ({ assert }) => {
    let called = false
    await runIfTrue(true, () => {
      called = true
    })
    assert.isTrue(called)

    called = false
    await runIfTrue(false, () => {
      called = true
    })
    assert.isFalse(called)
  })

  test('runIfFalse', async ({ assert }) => {
    let called = false
    await runIfFalse(false, () => {
      called = true
    })
    assert.isTrue(called)

    called = false
    await runIfFalse(true, () => {
      called = true
    })
    assert.isFalse(called)
  })

  test('generateOTP', ({ assert }) => {
    const otp = generateOTP()
    assert.equal(otp.length, 6)
    assert.isTrue(/^\d+$/.test(otp))

    const customLengthOTP = generateOTP(8)
    assert.equal(customLengthOTP.length, 8)
    assert.isTrue(/^\d+$/.test(customLengthOTP))
  })
})
