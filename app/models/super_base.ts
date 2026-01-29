import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, beforeUpdate, column } from '@adonisjs/lucid/orm'
import type { ModelAttributes, ModelObject } from '@adonisjs/lucid/types/model'

export default class SuperBaseModel extends BaseModel {
  /**
   * We assign UUID primary keys in `beforeCreate`.
   * Without this, Lucid may fallback to SQLite rowid (integers like 16),
   * which breaks foreign keys expecting UUID strings.
   */
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  // Optional shared JSON metadata for models that implement it
  declare metadata?: ModelObject

  public async mergeMetadata(newMetadata: ModelObject) {
    // Get the existing metadata from the database.
    const existingMetadata = this.metadata || {}
    // Merge the existing and new metadata.
    const mergedMetadata = { ...existingMetadata, ...newMetadata }
    // Update the model's metadata field.
    this.metadata = mergedMetadata
  }

  public async deepMerge(fieldName: keyof Partial<ModelAttributes<this>>, newData: ModelObject) {
    // Get the existing data for the given field from the database.
    // @ts-expect-error - We are dynamically accessing the field name here.
    const existingData = this[fieldName] || {}

    const deepMerge = (obj1: ModelObject, obj2: ModelObject) => {
      this.merge
      const output = { ...obj1 }
      Object.keys(obj2).forEach((key) => {
        if (obj2[key] instanceof Object && !Array.isArray(obj2[key]) && obj1?.[key]) {
          output[key] = deepMerge(obj1[key], obj2[key])
        } else {
          output[key] = obj2[key]
        }
      })
      return output
    }

    // Merge the existing and new data.
    const mergedData = deepMerge(existingData, newData)
    // Update the model's specified field.
    // @ts-expect-error - We are dynamically accessing the field name here.
    this[fieldName] = mergedData
  }

  @beforeCreate()
  public static assignId(model: SuperBaseModel) {
    if (!model.id) model.id = randomUUID()
  }

  @beforeUpdate()
  public static preventIdUpdate(model: SuperBaseModel) {
    const originalId = (model as unknown as { $original?: { id?: string } }).$original?.id
    if (originalId) model.id = originalId
  }
}
