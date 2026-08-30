import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { worker } from '#boss/base'

export default class TestBoss extends BaseCommand {
  static commandName = 'test:boss'
  static description = 'Test boss'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    await worker.ensureStarted()
    console.log('Done')
  }
}
