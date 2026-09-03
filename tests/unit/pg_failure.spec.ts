import { test } from '@japa/runner'

import { explainPgFailure } from '#services/backup_service'

/**
 * `pg_dump` refuses to dump a server newer than itself and says only that the versions
 * differ, which reads as a bug in the app rather than a missing client on the host.
 */
test.group('pg command failures', () => {
  const mismatch = [
    'pg_dump: error: aborting because of server version mismatch',
    'pg_dump: detail: server version: 17.11 (Debian 17.11-1.pgdg13+2); pg_dump version: 16.6 (Homebrew)',
  ].join('\n')

  test('names the versions and the fix', ({ assert }) => {
    const message = explainPgFailure('pg_dump', 1, mismatch)

    assert.include(message, 'pg_dump 16 cannot read a PostgreSQL 17 server')
    assert.include(message, 'brew install postgresql@17')
    /** The original output is kept: it is what an operator pastes into a ticket. */
    assert.include(message, 'aborting because of server version mismatch')
  })

  test('leaves an unrelated failure alone', ({ assert }) => {
    const message = explainPgFailure('psql', 2, 'psql: error: connection to server failed')

    assert.equal(message, 'psql exited with code 2: psql: error: connection to server failed')
    assert.notInclude(message, 'cannot read a PostgreSQL')
  })
})
