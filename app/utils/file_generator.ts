import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import string from '@adonisjs/core/helpers/string'
import app from '@adonisjs/core/services/app'

export interface FileGeneratorOptions {
  name: string
  basePath: string
  extension: string
  template: (componentName: string) => string
  isHook?: boolean
}

export function generateFile({
  name,
  basePath,
  extension,
  template,
  isHook,
}: FileGeneratorOptions) {
  if (!name) {
    throw new Error('Please provide a name for the file')
  }

  // Split the name into parts and apply dashCase to each part
  const nameParts = name.split('/')
  const dashCaseParts = nameParts.map((part) => string.dashCase(part))
  const newName = `${dashCaseParts.join('/')}.${extension}`
  const filePath = `${basePath}/${newName}`
  const fullPath = join(app.appRoot.pathname, filePath)
  const fileDir = dirname(fullPath)

  // Check if file already exists
  if (existsSync(fullPath)) {
    throw new Error(`File already exists at ${filePath}`)
  }

  // Create directory if it doesn't exist
  if (!existsSync(fileDir)) {
    mkdirSync(fileDir, { recursive: true })
  }

  const componentName = isHook
    ? string.camelCase(nameParts.pop()!)
    : string.pascalCase(nameParts.pop()!)
  writeFileSync(fullPath, template(componentName))

  return filePath
}
