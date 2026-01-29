import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { generateFile } from '#utils/file_generator'

export default class MakeEmail extends BaseCommand {
  static commandName = 'make:email'
  static description = 'Create a new email'

  @args.string({ description: 'Name of the email file' })
  declare name: string

  static options: CommandOptions = {}

  async run() {
    try {
      const filePath = generateFile({
        name: this.name,
        basePath: 'inertia/emails',
        extension: 'tsx',

        template: (componentName: string) => `
import * as React from 'react'
import { EmailWrapper } from '#emails/layout'

function ${componentName}() {
  return (
    <EmailWrapper>
      <></>
    </EmailWrapper>
  )
}

export default ${componentName}
    `,
      })

      this.logger.success(`Email created at ${filePath}`)
    } catch (error) {
      this.logger.error(error.message)
    }
  }
}
