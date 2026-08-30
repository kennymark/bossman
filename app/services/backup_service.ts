import { execSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import drive from '@adonisjs/drive/services/main'

import DatabaseBackup from '#models/db_backup'
import { SnitchService } from '#services/snitch_service'
import env from '#start/env'

const productionDB = env.get('PROD_DB')
const developmentDB = env.get('DEV_DB')

export default class BackupService {
  async createBackup(selectedDb: 'prod' | 'dev') {
    const now = new Date()
    const appRoot = app.appRoot.host
    const backupDir = path.join(appRoot, 'backups')
    const backupFileName = `v2-backup-${now.getTime()}-${selectedDb}.sql`
    const backupFilePath = path.join(backupDir, backupFileName)
    const connectionString = selectedDb === 'prod' ? productionDB : developmentDB
    const backupCommand = `pg_dump --no-owner --dbname=${connectionString} > ${backupFilePath}`
    try {
      logger.info('Initiating DB backup...')

      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      execSync(backupCommand)
      const file = fs.readFileSync(backupFilePath)
      logger.info('Backup sql file created')

      // upload to google cloud storage
      logger.info('Uploading to Cloudflare R2 and Google Cloud Storage')
      const r2 = drive.use('backup')

      await r2.put(backupFileName, file)
      logger.info('Backup uploaded to Cloudflare R2')

      const backup = await DatabaseBackup.create(
        {
          filePath: backupFilePath,
          fileSize: file.length,
        },
        { connection: selectedDb },
      )

      logger.info(`Backup created with id ${backup.id}`)

      await SnitchService.report.general(`Db backup completed now ${now.toISOString()}`, {
        backupFilePath,
        backupDir,
        selectedDb,
      })

      logger.info('Backup completed')
    } catch (err) {
      logger.error({ err }, 'Backup run failed')
      logger.error(err)
    }
  }

  /**
   * Restore a backup from storage to the given database connection URL.
   * @param backupId - ID of the backup record
   * @param connectionUrl - PostgreSQL connection URL (e.g. postgresql://user:pass@host:5432/dbname)
   * @param appEnv - DB connection for querying the backup record ('prod' | 'dev')
   */
  async restore(backupId: number, connectionUrl: string, appEnv: 'prod' | 'dev') {
    const backup = await DatabaseBackup.query({ connection: appEnv })
      .where('id', backupId)
      .firstOrFail()

    const fileName = backup.fileName!

    const r2 = drive.use('backup')
    const exists = await r2.exists(fileName)

    if (!exists) {
      throw new Error(`Backup file not found in storage: ${fileName}`)
    }

    logger.info(`Backup file exists: ${exists}`)

    const contents = await r2.get(fileName).catch((err) => {
      throw new Error(`Could not read backup file: ${fileName}`)
    })

    const buffer = Buffer.isBuffer(contents) ? contents : Buffer.from(contents)
    const tempDir = app.tmpPath()
    const tempFilePath = path.join(tempDir, `restore-${Date.now()}-${path.basename(fileName)}`)

    try {
      fs.writeFileSync(tempFilePath, buffer)
      logger.info(`Restoring backup ${fileName} to target database...`)

      const result = spawnSync('psql', [connectionUrl, '-f', tempFilePath], {
        stdio: 'pipe',
        encoding: 'utf-8',
      })

      if (result.status !== 0) {
        const stderr = result.stderr ?? result.error?.message ?? ''
        throw new Error(`psql restore failed: ${stderr}`)
      }

      logger.info('Restore completed successfully')
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
    }
  }
}
