import { test } from '@japa/runner'

import {
  buildRerunPayload,
  deriveJobStatus,
  escapeRegex,
  isJobId,
  jobDisplayName,
  nameSearchPattern,
  RERUN_SOURCE,
} from '#utils/jobs'

/**
 * The pure half of the job monitor: everything that decides what a request means
 * before the driver is involved. These helpers are shared with the jobs pages, so a
 * status the table shows is the status the server would compute.
 */
test.group('job ids', () => {
  test('accepts a 24-character hex string in either case', ({ assert }) => {
    assert.isTrue(isJobId('64b7f3a2c1d2e3f4a5b6c7d8'))
    assert.isTrue(isJobId('64B7F3A2C1D2E3F4A5B6C7D8'))
  })

  test('rejects anything the driver would throw on', ({ assert }) => {
    assert.isFalse(isJobId('64b7f3a2c1d2e3f4a5b6c7d'))
    assert.isFalse(isJobId('64b7f3a2c1d2e3f4a5b6c7d8a'))
    assert.isFalse(isJobId('zzb7f3a2c1d2e3f4a5b6c7d8'))
    assert.isFalse(isJobId(''))
    assert.isFalse(isJobId(undefined))
    assert.isFalse(isJobId(null))
    assert.isFalse(isJobId(123456789012345678901234))
    assert.isFalse(isJobId({ toString: () => '64b7f3a2c1d2e3f4a5b6c7d8' }))
  })
})

test.group('regex escaping', () => {
  test('neutralises every metacharacter', ({ assert }) => {
    assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c')
    assert.equal(escapeRegex('.*'), '\\.\\*')
    assert.equal(escapeRegex('send(Email)?'), 'send\\(Email\\)\\?')
    assert.equal(escapeRegex('[a-z]+|$^{}\\/'), '\\[a-z\\]\\+\\|\\$\\^\\{\\}\\\\\\/')
  })

  test('the escaped term matches itself literally and nothing broader', ({ assert }) => {
    const pattern = new RegExp(escapeRegex('send(Email)'), 'i')
    assert.isTrue(pattern.test('SEND(EMAIL)'))
    assert.isFalse(pattern.test('sendEmail'))

    const wildcard = new RegExp(escapeRegex('.*'))
    assert.isFalse(wildcard.test('processPayment'))
    assert.isTrue(wildcard.test('a.*b'))
  })

  test('leaves ordinary names alone', ({ assert }) => {
    assert.equal(escapeRegex('processPayment'), 'processPayment')
    assert.equal(escapeRegex('lease-expiry-notifier'), 'lease-expiry-notifier')
  })
})

test.group('job status', () => {
  const now = new Date('2026-09-02T12:00:00Z')
  const earlier = '2026-09-02T11:00:00Z'
  const later = '2026-09-02T13:00:00Z'

  test('a lock means it is running, whatever else is set', ({ assert }) => {
    assert.equal(
      deriveJobStatus({ lockedAt: earlier, failedAt: earlier, nextRunAt: later }, now),
      'running',
    )
  })

  test('a failure with no run started after it is failed', ({ assert }) => {
    assert.equal(deriveJobStatus({ failedAt: earlier }, now), 'failed')
    assert.equal(deriveJobStatus({ failedAt: earlier, lastRunAt: earlier }, now), 'failed')
    assert.equal(
      deriveJobStatus({ failedAt: earlier, lastRunAt: earlier, nextRunAt: later }, now),
      'failed',
    )
  })

  test('a failure that a later run recovered from no longer counts', ({ assert }) => {
    const failedAt = '2026-09-01T00:00:00Z'
    assert.equal(
      deriveJobStatus({ failedAt, lastRunAt: earlier, lastFinishedAt: earlier }, now),
      'completed',
    )
    assert.equal(
      deriveJobStatus({ failedAt, lastRunAt: earlier, nextRunAt: later }, now),
      'scheduled',
    )
  })

  test('a future next run is scheduled; a past one is queued', ({ assert }) => {
    assert.equal(deriveJobStatus({ nextRunAt: later }, now), 'scheduled')
    assert.equal(deriveJobStatus({ nextRunAt: earlier }, now), 'queued')
    assert.equal(deriveJobStatus({ nextRunAt: now }, now), 'queued')
  })

  test('nothing pending but a finish time is completed; nothing at all is idle', ({ assert }) => {
    assert.equal(deriveJobStatus({ lastFinishedAt: earlier, lastRunAt: earlier }, now), 'completed')
    assert.equal(deriveJobStatus({}, now), 'idle')
    assert.equal(deriveJobStatus({ nextRunAt: null, failedAt: null, lockedAt: null }, now), 'idle')
  })

  test('accepts Date objects and ignores unparseable values', ({ assert }) => {
    assert.equal(deriveJobStatus({ nextRunAt: new Date(later) }, now), 'scheduled')
    assert.equal(deriveJobStatus({ nextRunAt: 'not a date' }, now), 'idle')
    assert.equal(deriveJobStatus({ lockedAt: '' }, now), 'idle')
  })
})

test.group('re-run payload', () => {
  const now = new Date('2026-09-02T12:00:00Z')
  const previousJobId = '64b7f3a2c1d2e3f4a5b6c7d8'

  test('is a one-off due now that remembers where it came from', ({ assert }) => {
    const payload = buildRerunPayload(
      { name: 'processPayment', data: { paymentId: 'p_1' }, priority: 10 },
      previousJobId,
      now,
    )

    assert.equal(payload.name, 'processPayment')
    assert.equal(payload.type, 'normal')
    assert.strictEqual(payload.nextRunAt, now)
    assert.isNull(payload.repeatInterval)
    assert.isNull(payload.repeatTimezone)
    assert.equal(payload.priority, 10)
    assert.equal(payload.lastModifiedBy, RERUN_SOURCE)
    assert.deepEqual(payload.data, {
      paymentId: 'p_1',
      reEnqueue: true,
      enqueuedFromAdmin: true,
      previousJobId,
    })
  })

  test('starts with a clean run history', ({ assert }) => {
    const payload = buildRerunPayload({ name: 'sendEmail' }, previousJobId, now)

    assert.isNull(payload.lockedAt)
    assert.isNull(payload.lastRunAt)
    assert.isNull(payload.lastFinishedAt)
    assert.isNull(payload.failedAt)
    assert.isNull(payload.failReason)
    assert.equal(payload.failCount, 0)
    assert.equal(payload.progress, 0)
    assert.equal(payload.priority, 0)
    assert.isFalse(payload.shouldSaveResult)
  })

  test('does not mutate the source data and tolerates a missing payload', ({ assert }) => {
    const data = { orgId: 'o_1' }
    buildRerunPayload({ name: 'log', data }, previousJobId, now)
    assert.deepEqual(data, { orgId: 'o_1' })

    const bare = buildRerunPayload(
      { name: 'log', data: null, priority: 'high' },
      previousJobId,
      now,
    )
    assert.deepEqual(bare.data, { reEnqueue: true, enqueuedFromAdmin: true, previousJobId })
    assert.equal(bare.priority, 0)
  })

  test('the clone overrides any stale provenance in the source', ({ assert }) => {
    const payload = buildRerunPayload(
      { name: 'log', data: { reEnqueue: false, previousJobId: 'old', enqueuedFromAdmin: false } },
      previousJobId,
      now,
    )

    assert.isTrue(payload.data.reEnqueue)
    assert.isTrue(payload.data.enqueuedFromAdmin)
    assert.equal(payload.data.previousJobId, previousJobId)
  })
})

/**
 * Names are stored as the product registered them — camelCase for most jobs, spaced
 * words for a few — and shown title-cased. Search has to accept either, or an operator
 * cannot search for what the table is showing them.
 */
test.group('Job names', () => {
  test('titles a stored name for display', ({ assert }) => {
    assert.equal(jobDisplayName('nudgeReference'), 'Nudge Reference')
    assert.equal(jobDisplayName('process-payment'), 'Process Payment')
    assert.equal(jobDisplayName('send_email'), 'Send Email')
    assert.equal(jobDisplayName('Auto Archive Leases'), 'Auto Archive Leases')
    assert.equal(jobDisplayName('log'), 'Log')
  })

  test('names an unnamed job rather than rendering nothing', ({ assert }) => {
    assert.equal(jobDisplayName(''), 'Unnamed')
    assert.equal(jobDisplayName(null), 'Unnamed')
    assert.equal(jobDisplayName(undefined), 'Unnamed')
  })

  test('matches a stored name from what the table shows', ({ assert }) => {
    const pattern = new RegExp(nameSearchPattern('Nudge Reference'), 'i')
    assert.isTrue(pattern.test('nudgeReference'))
    assert.isTrue(pattern.test('nudge-reference'))
    assert.isTrue(pattern.test('Nudge Reference'))
    assert.isFalse(pattern.test('processPayment'))
  })

  test('still matches a partial term', ({ assert }) => {
    assert.isTrue(new RegExp(nameSearchPattern('payment'), 'i').test('processPayment'))
    assert.isTrue(new RegExp(nameSearchPattern('archive leases'), 'i').test('Auto Archive Leases'))
  })

  test('keeps regex metacharacters literal', ({ assert }) => {
    const pattern = new RegExp(nameSearchPattern('.*'), 'i')
    assert.isFalse(pattern.test('anything'))
    assert.isTrue(pattern.test('a.*b'))
    assert.equal(nameSearchPattern('   '), '')
  })
})
