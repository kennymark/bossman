import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import drive from '@adonisjs/drive/services/main'

import DbBackup from '#models/db_backup'
import BackupService from '#services/backup_service'
import DbBackupTransformer from '#transformers/db_backup_transformer'
import { paginatedIndex } from '#utils/paginated_index'

export default class DbBackupsController {
  async index({ request, inertia }: HttpContext) {
    const appEnv = request.appEnv()
    const pageProps = await paginatedIndex(
      request,
      inertia,
      'backups',
      (page, perPage) =>
        DbBackup.query({ connection: appEnv }).orderBy('createdAt', 'desc').paginate(page, perPage),
      DbBackupTransformer,
      { defaultPerPage: 20 },
    )
    return inertia.render('db-backups/index', pageProps)
  }

  /** API: create a new backup. Returns JSON. */
  async store({ request, response, logger }: HttpContext) {
    const appEnv = request.appEnv()
    const backupService = new BackupService()
    try {
      logger.info('Creating backup...')
      await backupService.createBackup(appEnv)
      logger.info('Backup created successfully')
      return response.ok({ success: true })
    } catch (err) {
      logger.error(err)
      return response.badRequest({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  /** Download a backup file. */
  async download({ params, request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const backup = await DbBackup.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    const fileName = backup.fileName!
    const r2 = drive.use('backup')
    const exists = await r2.exists(fileName)
    if (!exists) {
      return response.notFound({ error: 'Backup file not found in storage' })
    }
    const contents = await r2.get(fileName)
    if (!contents) {
      return response.notFound({ error: 'Could not read backup file' })
    }
    const buffer = Buffer.isBuffer(contents) ? contents : Buffer.from(contents)
    response
      .header('Content-Type', 'application/sql')
      .header('Content-Disposition', `attachment; filename="${fileName}"`)
      .send(buffer)
  }

  /** API: restore a backup to the given database connection URL. */
  async restore({ params, request, response, logger }: HttpContext) {
    const appEnv = request.appEnv()
    const backupId = Number(params.id)
    if (Number.isNaN(backupId)) {
      return response.badRequest({ error: 'Invalid backup ID' })
    }
    const body = request.body() as { connectionUrl?: string }
    const connectionUrl = typeof body.connectionUrl === 'string' ? body.connectionUrl.trim() : ''
    if (!connectionUrl) {
      return response.badRequest({ error: 'Connection URL is required' })
    }
    const backupService = new BackupService()
    try {
      logger.info(`Restoring backup ${backupId} to target database...`)
      await backupService.restore(backupId, connectionUrl, appEnv)
      return response.ok({ success: true, message: 'Restore completed successfully' })
    } catch (err) {
      logger.error(err)
      return response.badRequest({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  async destroy({ params, response, request, session }: HttpContext) {
    const appEnv = request.appEnv()
    const backup = await DbBackup.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    const fileName = backup.fileName!

    try {
      const r2 = drive.use('backup')
      await r2.delete(fileName)
      await backup.delete()
      logger.info(`Deleted backup file from R2: ${fileName}`)
      session.flash('success', { message: 'Backup deleted.' })
    } catch (err) {
      /** Previously swallowed, so a failed delete still redirected as if it had worked. */
      logger.error({ err, fileName }, 'Failed to delete backup')
      session.flash('error', { message: 'Could not delete the backup. Please try again.' })
    }

    return response.redirect('/db-backups')
  }
}
