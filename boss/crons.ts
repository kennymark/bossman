import logger from '@adonisjs/core/services/logger'

import { runsHostJobs, worker } from '#boss/base'
import { backup } from '#boss/jobs/backup'
import { backupHealthCheck } from '#boss/jobs/backup_health_check'
import { expireProdAccess } from '#boss/jobs/expire_prod_access'
import { pruneLocalBackups } from '#boss/jobs/prune_local_backups'
import { sendScheduledPushNotifications } from '#boss/jobs/send_scheduled_push_notifications'

import schedules from './schedules.js'

/**
 * Register all recurring cron schedules. Call after jobs are loaded (e.g. from start/events).
 * Starts boss if not already started, then registers each cron.
 */
export async function registerCrons(): Promise<void> {
  /**
   * Schedules live in the shared admin database, so registering them from a laptop
   * points production's own crons at a developer's machine. See `runsHostJobs`.
   */
  if (!runsHostJobs()) {
    logger.info('Skipping cron registration: host jobs are off outside production')
    return
  }

  await worker.ensureStarted()

  await backup.scheduleCron(schedules.EVERY_6_HOURS, { database: 'prod' })

  /** Catches dumps left behind by a run that died between writing and uploading. */
  await pruneLocalBackups.scheduleCron(schedules.EVERY_DAY, { keep: 2 })

  /** Shouts when backups stop happening; see the job for why this is not optional. */
  await backupHealthCheck.scheduleCron(schedules.EVERY_HOUR, {})

  /** Drops lapsed production grants so the stored flag matches what is enforced. */
  await expireProdAccess.scheduleCron(schedules.EVERY_HOUR, {})

  /** Sends OneSignal pushes whose scheduled_at has passed. */
  await sendScheduledPushNotifications.scheduleCron(schedules.EVERY_MINUTE, {})
}
