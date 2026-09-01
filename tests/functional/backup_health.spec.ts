import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import BackupRun from '#models/backup_run'
import User from '#models/user'

/**
 * The backup health panel must never take the backups page down.
 *
 * `buildHealth` reads `backup_runs`, and the page's real job is listing backups. When
 * that table was missing — a deploy where the migrations had not been run yet — the
 * query threw and the whole page crashed, trading the useful part of the screen for
 * the decorative one.
 */
test.group('Backup health', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  })

  async function godAdmin() {
    return User.create({
      fullName: 'God Admin',
      email: `god-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'password123',
      role: 'super_admin',
      isGodAdmin: true,
    })
  }

  test('reports health when the run log is readable', async ({ client, assert }) => {
    const user = await godAdmin()

    const response = await client.get('/api/v1/db-backups/health').loginAs(user)

    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body.environments)
    assert.lengthOf(body.environments, 2)
    assert.notProperty(body, 'unavailable')
  })

  test('degrades instead of throwing when the run log cannot be read', async ({
    client,
    assert,
  }) => {
    const user = await godAdmin()

    /**
     * Points the model at a table that does not exist, which is the same failure the
     * un-migrated deploy produced. Done this way rather than with `DROP TABLE` because
     * the DDL lock deadlocks against the test's global transaction.
     */
    const originalTable = BackupRun.table
    BackupRun.table = 'backup_runs_missing_on_purpose'

    try {
      const response = await client.get('/api/v1/db-backups/health').loginAs(user)

      response.assertStatus(200)
      const body = response.body()
      assert.isTrue(body.unavailable, 'the panel must be told it has no data')
      assert.lengthOf(body.environments, 2)
      for (const env of body.environments) {
        assert.equal(env.status, 'unknown')
        assert.isNull(env.lastSuccessAt)
      }
    } finally {
      BackupRun.table = originalTable
    }
  })
})
