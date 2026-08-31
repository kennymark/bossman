import { test } from '@japa/runner'

import { MAX_PER_PAGE, validateQueryParams } from '#utils/vine'

/**
 * `perPage` becomes a SQL LIMIT against the live customer databases. It used to be an
 * unbounded `vine.number()`, so `?perPage=1000000` pulled an unbounded result set out
 * of production, and a negative `page` produced a negative OFFSET and a driver 500.
 */
test.group('pagination query params', () => {
  test('caps perPage at the ceiling', async ({ assert }) => {
    const params = await validateQueryParams({ perPage: '1000000' } as never)
    assert.equal(params.perPage, MAX_PER_PAGE)
  })

  test('floors page and perPage at 1', async ({ assert }) => {
    const negative = await validateQueryParams({ page: '-5', perPage: '0' } as never)
    assert.equal(negative.page, 1)
    assert.equal(negative.perPage, 1)
  })

  test('leaves a sane request alone', async ({ assert }) => {
    const params = await validateQueryParams({ page: '3', perPage: '50' } as never)
    assert.equal(params.page, 3)
    assert.equal(params.perPage, 50)
  })

  test('clamps rather than rejecting, so navigation never 400s', async ({ assert }) => {
    await assert.doesNotReject(() => validateQueryParams({ perPage: '99999' } as never))
  })

  /** These reach `created_at::date >= ?`, where a non-date is a 500 from the driver. */
  test('rejects a date that is not ISO', async ({ assert }) => {
    await assert.rejects(() =>
      validateQueryParams({ startDate: 'not-a-date', endDate: '2026-01-01' } as never),
    )
  })

  test('accepts an ISO date range', async ({ assert }) => {
    const params = await validateQueryParams({
      startDate: '2026-01-01',
      endDate: '2026-02-01',
    } as never)
    assert.equal(params.startDate, '2026-01-01')
  })
})
