import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import drive from '@adonisjs/drive/services/main'

import BlogPost from '#models/blog_post'

export default class MigrateImages extends BaseCommand {
  static commandName = 'migrate:images'
  static description = 'Migrate images from backup drive to blog drive'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const posts = await BlogPost.query({ connection: 'prod' }).whereNotNull('coverImage')

    this.logger.info(`Found ${posts.length} posts with cover images`)

    const blogDrive = drive.use('blog')
    const backupDrive = drive.use('backup')

    for (const post of posts) {
      const coverImage = post.coverImage
      if (!coverImage) continue
      //if image exisits in backup drive, then copy it to blog drive
      const exists = await backupDrive.exists(coverImage.path)

      // if image exists in blog drive, then delete it
      if (exists) {

        const file = await backupDrive.getBytes(coverImage.path)

        await blogDrive.put(coverImage.path, file, { contentType: coverImage.mimeType })
        this.logger.info(`Migrated ${coverImage.originalName} to blog drive`)
      }
    }
  }
}
