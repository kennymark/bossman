import vine from '@vinejs/vine'

import {
  DOCUMENT_COMPLIANCE_FILTERS,
  DOCUMENT_EXPIRY_FILTERS,
  DOCUMENT_SORT_COLUMNS,
  DOCUMENT_TYPES,
} from '#utils/document_expiry'
import { listPageFields, listSearchFields } from '#validators/list_fields'

/**
 * Every filter maps to a fixed set — a bound value or an ORDER BY identifier — so each
 * is an enum rather than a free string.
 */
const documentFilterFields = {
  ...listSearchFields,
  compliance: vine.enum(DOCUMENT_COMPLIANCE_FILTERS).optional(),
  expiry: vine.enum(DOCUMENT_EXPIRY_FILTERS).optional(),
  docType: vine.enum(DOCUMENT_TYPES).optional(),
  sortBy: vine.enum(DOCUMENT_SORT_COLUMNS).optional(),
}

export const documentsIndexValidator = vine.create(
  vine.object({ ...listPageFields, ...documentFilterFields }),
)

export const documentsExportValidator = vine.create(vine.object({ ...documentFilterFields }))
