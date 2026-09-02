import { test } from '@japa/runner'

import { type CsvColumn, csvCell, csvFilename, toCsv } from '#utils/csv'

/**
 * Exports are the one artefact of customer data that leaves the console, and they are
 * opened in spreadsheets that will happily evaluate a cell as a formula. Encoding has
 * to be boring and exact.
 */
test.group('csv cells', () => {
  test('quotes every cell and doubles embedded quotes', ({ assert }) => {
    assert.equal(csvCell('plain'), '"plain"')
    assert.equal(csvCell('say "hi"'), '"say ""hi"""')
    assert.equal(csvCell('a,b'), '"a,b"')
    assert.equal(csvCell('line one\nline two'), '"line one\nline two"')
  })

  test('neutralises a leading formula operator', ({ assert }) => {
    assert.equal(csvCell('=SUM(A1:A9)'), '"\t=SUM(A1:A9)"')
    assert.equal(csvCell('+1'), '"\t+1"')
    assert.equal(csvCell('-1'), '"\t-1"')
    assert.equal(csvCell('@import'), '"\t@import"')
    /** Only a leading operator is a formula; one mid-cell is just text. */
    assert.equal(csvCell('a=b'), '"a=b"')
  })

  test('renders null and undefined as an empty quoted cell', ({ assert }) => {
    assert.equal(csvCell(null), '""')
    assert.equal(csvCell(undefined), '""')
  })

  test('renders dates as ISO and objects as JSON', ({ assert }) => {
    assert.equal(csvCell(new Date('2026-09-02T10:20:30.000Z')), '"2026-09-02T10:20:30.000Z"')
    assert.equal(csvCell({ rows: 3 }), '"{""rows"":3}"')
    assert.equal(csvCell(true), '"true"')
    assert.equal(csvCell(42), '"42"')
  })
})

test.group('csv documents', () => {
  interface Row {
    id: number
    name: string | null
  }

  const columns: readonly CsvColumn<Row>[] = [
    { header: 'ID', value: (row) => row.id },
    { header: 'Name', value: (row) => row.name },
  ]

  test('writes a header line and CRLF line endings', ({ assert }) => {
    const csv = toCsv(
      [
        { id: 1, name: 'Ada' },
        { id: 2, name: null },
      ],
      columns,
    )

    assert.equal(csv, '"ID","Name"\r\n"1","Ada"\r\n"2",""\r\n')
  })

  test('an empty export is just the header', ({ assert }) => {
    assert.equal(toCsv([], columns), '"ID","Name"\r\n')
  })

  test('applies the same escaping to header cells', ({ assert }) => {
    const csv = toCsv([], [{ header: '=cmd', value: () => null }])
    assert.equal(csv, '"\t=cmd"\r\n')
  })
})

test.group('csv filename', () => {
  test('is lower-case, dashed and dated', ({ assert }) => {
    const date = new Date('2026-09-02T23:59:59.000Z')
    assert.equal(csvFilename('orgs', date), 'orgs-2026-09-02.csv')
    assert.equal(csvFilename('Admin Actions!', date), 'admin-actions-2026-09-02.csv')
    assert.equal(csvFilename('--Leases--', date), 'leases-2026-09-02.csv')
  })

  test('falls back to "export" when nothing safe is left', ({ assert }) => {
    assert.equal(csvFilename('***', new Date('2026-01-31T00:00:00.000Z')), 'export-2026-01-31.csv')
  })
})
