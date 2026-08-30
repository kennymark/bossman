import { test } from '@japa/runner'

import { requiredPageKeyForPath } from '#utils/page_access'

/**
 * The API path and the page it backs must resolve to the same grant, otherwise gating
 * the page leaves its JSON endpoints open.
 */
test.group('requiredPageKeyForPath', () => {
  test('maps a page and its API to the same grant', ({ assert }) => {
    const pairs: [string, string][] = [
      ['/analytics', '/api/v1/analytics/orgs/stats'],
      ['/db-backups', '/api/v1/db-backups/3/restore'],
      ['/orgs', '/api/v1/orgs/1/actions/ban-user'],
      ['/servers', '/api/v1/railway/projects'],
      ['/properties', '/api/v1/leaseable-entities/stats'],
      ['/teams', '/api/v1/members'],
    ]

    for (const [page, api] of pairs) {
      assert.equal(
        requiredPageKeyForPath(api),
        requiredPageKeyForPath(page),
        `${api} must require the same grant as ${page}`,
      )
    }
  })

  test('gates blog management but not the public blog', ({ assert }) => {
    assert.equal(requiredPageKeyForPath('/blog/manage/2/edit'), 'blog')
    assert.isNull(requiredPageKeyForPath('/blog/some-published-post'))
  })

  test('leaves personal routes ungated', ({ assert }) => {
    assert.isNull(requiredPageKeyForPath('/settings'))
    assert.isNull(requiredPageKeyForPath('/api/v1/notifications'))
    assert.isNull(requiredPageKeyForPath('/api/v1/update-env'))
  })

  test('is unaffected by trailing slashes', ({ assert }) => {
    assert.equal(requiredPageKeyForPath('/api/v1/orgs/'), 'orgs')
    assert.equal(requiredPageKeyForPath('/orgs'), 'orgs')
  })
})
