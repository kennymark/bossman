import vine from '@vinejs/vine'

import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from '#utils/search'

/** Truthy query-string flags arrive as `1` or `true`. */
const FLAG_VALUES = new Set(['1', 'true'])

/**
 * `GET /api/v1/search`. The query is trimmed and bounded here so nothing longer than
 * `MAX_QUERY_LENGTH` reaches the trigram operators; `groups` is a CSV whose members are
 * checked against the allow-list in `#utils/search` rather than here, so an unknown
 * name is ignored instead of failing the whole request.
 */
export const searchValidator = vine.create(
  vine.object({
    q: vine.string().trim().minLength(MIN_QUERY_LENGTH).maxLength(MAX_QUERY_LENGTH),
    groups: vine.string().trim().maxLength(200).optional(),
    includeTest: vine
      .string()
      .optional()
      .transform((value) => (value === undefined ? false : FLAG_VALUES.has(value.toLowerCase()))),
  }),
)
