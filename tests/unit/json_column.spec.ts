import { test } from '@japa/runner'

import { consumeJsonArray, consumeJsonObject, prepareJson } from '#utils/json_column'

/**
 * PostgreSQL `json` columns arrive already parsed from the `pg` driver. Consuming them
 * with a bare `JSON.parse` crashed any page that read the row — an empty array reaches
 * `JSON.parse` as `""` and throws "Unexpected end of JSON input".
 */
test.group('json column helpers', () => {
  test('accepts values the driver already parsed', ({ assert }) => {
    assert.deepEqual(consumeJsonArray<string>(['a', 'b']), ['a', 'b'])
    assert.deepEqual(consumeJsonObject({ a: 1 }), { a: 1 })
  })

  test('handles the empty array that caused the crash', ({ assert }) => {
    assert.deepEqual(consumeJsonArray<string>([]), [])
  })

  test('still parses JSON strings from text columns', ({ assert }) => {
    assert.deepEqual(consumeJsonArray<string>('["a","b"]'), ['a', 'b'])
    assert.deepEqual(consumeJsonObject('{"a":1}'), { a: 1 })
  })

  test('returns null for null, empty and malformed values', ({ assert }) => {
    for (const v of [null, undefined, '', '   ', '{not json']) {
      assert.isNull(consumeJsonArray(v), `array: ${JSON.stringify(v)}`)
      assert.isNull(consumeJsonObject(v), `object: ${JSON.stringify(v)}`)
    }
  })

  test('does not confuse arrays and objects', ({ assert }) => {
    assert.isNull(consumeJsonObject(['a']))
    assert.isNull(consumeJsonArray({ a: 1 }))
  })

  test('prepare serialises and treats null and undefined alike', ({ assert }) => {
    assert.equal(prepareJson(['a']), '["a"]')
    assert.equal(prepareJson([]), '[]')
    assert.isNull(prepareJson(null))
    assert.isNull(prepareJson(undefined))
  })
})
