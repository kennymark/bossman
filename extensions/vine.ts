import db from '@adonisjs/lucid/services/db'
import vine, { VineString } from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'

/**
 * Options accepted by the unique rule
 */
export type DbOptions = {
  table: string
  column: string
  connection?: string
}

// ensure the value exists in the database
async function exists(value: unknown, options: DbOptions, field: FieldContext) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return
  }

  const row = await db
    .connection(options.connection)
    .from(options.table)
    .select(options.column)
    .where(options.column, value)
    .first()

  if (!row) {
    field.report('The {{ field }} field does not exist', 'exist', field)
  }
}

/**
 * Implementation
 */
async function unique(value: unknown, options: DbOptions, field: FieldContext) {
  /**
   * We do not want to deal with non-string
   * values. The "string" rule will handle the
   * the validation.
   */
  if (typeof value !== 'string') {
    return
  }

  const row = await db
    .connection(options.connection)
    .from(options.table)
    .select(options.column)
    .where(options.column, value)
    .first()

  if (row) {
    field.report('The {{ field }} field is not unique', 'unique', field)
  }
}

/**
 * Converting a function to a VineJS rule
 */
const uniqueRule = vine.createRule(unique)
const existsRule = vine.createRule(exists)

VineString.macro('unique', function (this: VineString, options: DbOptions) {
  return this.use(uniqueRule(options))
})

VineString.macro('exists', function (this: VineString, options: DbOptions) {
  return this.use(existsRule(options))
})

// Vine.macro('dateTime', function (this: Vine) {
//   return this.date().transform((value) => DateTime.fromJSDate(value))
// })

declare module '@vinejs/vine' {
  interface Vine {
    dateTime(): this
  }
  interface VineString {
    unique(options: DbOptions): this
    exists(options: DbOptions): this
  }
}
