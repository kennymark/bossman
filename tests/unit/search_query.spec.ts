import { test } from '@japa/runner'

import {
  escapeLikePattern,
  filterSearchGroupsByPageAccess,
  isUuid,
  MAX_QUERY_LENGTH,
  normaliseSearchQuery,
  parseSearchGroups,
  SEARCH_GROUPS,
  searchTerms,
} from '#utils/search'

test.group('search query helpers', () => {
  test('normalises whitespace and caps the length', ({ assert }) => {
    assert.equal(normaliseSearchQuery('  hello   world  '), 'hello world')
    assert.equal(normaliseSearchQuery(undefined), '')
    assert.lengthOf(normaliseSearchQuery('a'.repeat(500)), MAX_QUERY_LENGTH)
  })

  test('splits a query into terms and drops single characters', ({ assert }) => {
    assert.deepEqual(searchTerms('flat 12 a baker street'), ['flat', '12', 'baker', 'street'])
    assert.deepEqual(searchTerms(''), [])
  })

  test('falls back to the phrase when no term is long enough', ({ assert }) => {
    assert.deepEqual(searchTerms('a b'), ['a b'])
  })

  test('caps the number of terms', ({ assert }) => {
    const terms = searchTerms(Array.from({ length: 20 }, (_, i) => `term${i}`).join(' '))
    assert.lengthOf(terms, 8)
  })

  test('escapes ILIKE pattern characters', ({ assert }) => {
    assert.equal(escapeLikePattern('100%_done\\'), '100\\%\\_done\\\\')
  })

  test('recognises a UUID in either case', ({ assert }) => {
    assert.isTrue(isUuid('3f2504e0-4f89-11d3-9a0c-0305e82c3301'))
    assert.isTrue(isUuid(' 3F2504E0-4F89-11D3-9A0C-0305E82C3301 '))
    assert.isFalse(isUuid('3f2504e04f8911d39a0c0305e82c3301'))
    assert.isFalse(isUuid('not-a-uuid'))
  })
})

test.group('search groups', () => {
  test('defaults to every group and ignores unknown names', ({ assert }) => {
    assert.deepEqual(parseSearchGroups(undefined), [...SEARCH_GROUPS])
    assert.deepEqual(parseSearchGroups('leases, orgs ,bogus'), ['orgs', 'leases'])
    assert.deepEqual(parseSearchGroups('bogus'), [])
  })

  test('an unrestricted member sees every group', ({ assert }) => {
    assert.deepEqual(filterSearchGroupsByPageAccess(SEARCH_GROUPS, null), [...SEARCH_GROUPS])
  })

  test('users and tenants follow the orgs grant', ({ assert }) => {
    assert.deepEqual(filterSearchGroupsByPageAccess(SEARCH_GROUPS, ['orgs']), [
      'orgs',
      'users',
      'tenants',
    ])
    assert.deepEqual(filterSearchGroupsByPageAccess(SEARCH_GROUPS, ['leases', 'maintenance']), [
      'leases',
      'maintenance',
    ])
    assert.deepEqual(filterSearchGroupsByPageAccess(SEARCH_GROUPS, ['dashboard']), [])
  })
})
