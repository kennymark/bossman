import { test } from '@japa/runner'

import { publicError } from '#exceptions/handler'

/**
 * Anything reaching an Inertia error page becomes a page prop, and `/blog` and
 * `/blog/:slug` are public. `pg` errors carry enumerable `detail`, `table`, `column`
 * and `constraint` fields, so handing the raw error to `errors/server_error` disclosed
 * the schema to anonymous visitors.
 */
test.group('publicError', () => {
  /** Mirrors the shape a `pg` driver error actually has. */
  function pgError() {
    const err = new Error('insert or update on table "leases" violates foreign key constraint')
    Object.assign(err, {
      code: '23503',
      detail: 'Key (org_id)=(org_abc123) is not present in table "orgs".',
      table: 'leases',
      column: 'org_id',
      constraint: 'leases_org_id_fkey',
      schema: 'public',
      status: 500,
    })
    return err
  }

  test('drops every driver detail', ({ assert }) => {
    const safe = publicError(pgError())
    const serialised = JSON.stringify(safe)

    for (const leak of ['23503', 'org_abc123', 'leases', 'org_id', 'leases_org_id_fkey', 'orgs']) {
      assert.notInclude(serialised, leak)
    }
  })

  test('emits only a status and a generic message', ({ assert }) => {
    assert.deepEqual(Object.keys(publicError(pgError())).sort(), ['message', 'status'])
  })

  test('keeps the status so the page can distinguish 404 from 500', ({ assert }) => {
    assert.equal(publicError({ status: 404 }).status, 404)
    assert.include(publicError({ status: 404 }).message.toLowerCase(), 'could not be found')
    assert.equal(publicError({ status: 500 }).status, 500)
  })

  test('defaults to 500 for anything unrecognised', ({ assert }) => {
    assert.equal(publicError(undefined).status, 500)
    assert.equal(publicError('a string').status, 500)
    assert.equal(publicError(new Error('boom')).status, 500)
  })

  test('never echoes the original message', ({ assert }) => {
    assert.notInclude(
      publicError(new Error('connection string: postgres://u:p@h/db')).message,
      'postgres://',
    )
  })
})
