import logger from '@adonisjs/core/services/logger'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

import { runsHostJobs, worker } from '#boss/base'
import BackupRun from '#models/backup_run'
import { SnitchService } from '#services/snitch_service'

/**
 * Hours without a successful backup before we shout about it.
 *
 * The backup cron runs every 6 hours, so 14 means at least two consecutive runs have
 * been missed or have failed.
 */
const STALE_AFTER_HOURS = 14

/**
 * Alerts when backups stop happening.
 *
 * Nothing watched this before. `createBackup` swallowed its own errors, so a database
 * could go weeks without a usable backup while the UI reported every run as a success —
 * the failure would only surface at the moment a restore was needed.
 */
export const backupHealthCheck = worker
  .createJob('backup-health-check')
  .input(vine.object({}))
  .retry({ limit: 3, delay: 300, backoff: true })

const checkBackupHealth = async () => {
  for (const appEnv of ['dev', 'prod'] as const) {
    const lastSuccess = await BackupRun.query()
      .where('appEnv', appEnv)
      .where('status', 'success')
      .orderBy('startedAt', 'desc')
      .first()

    const ageHours = lastSuccess?.startedAt
      ? DateTime.now().diff(lastSuccess.startedAt, 'hours').hours
      : null

    /** No history at all is expected right after deploy, so it is a warning, not a page. */
    if (!lastSuccess || ageHours === null) {
      logger.warn({ appEnv }, 'No successful backup recorded yet')
      continue
    }

    if (ageHours < STALE_AFTER_HOURS) continue

    const lastFailure = await BackupRun.query()
      .where('appEnv', appEnv)
      .where('status', 'failed')
      .orderBy('startedAt', 'desc')
      .first()

    await SnitchService.report.critical(
      `No successful ${appEnv} database backup for ${Math.round(ageHours)} hours.`,
      {
        appEnv,
        lastSuccessAt: lastSuccess.startedAt.toISO(),
        lastError: lastFailure?.error ?? null,
      },
    )
  }
}

/**
 * Only the deployed host alerts on backup health. A second subscriber would consume
 * the hourly check and alert on the other host's behalf; see `runsHostJobs`.
 */
if (runsHostJobs()) {
  backupHealthCheck.work(checkBackupHealth)
}
