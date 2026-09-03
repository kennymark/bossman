import vine from '@vinejs/vine'

import { runsHostJobs, worker } from '#boss/base'
import BackupService from '#services/backup_service'

export const backup = worker
  .createJob('backup')
  .input(
    vine.object({
      database: vine.enum(['prod', 'dev']),
    }),
  )
  .retry({ limit: 10, backoff: true, delay: 10 })
  .deadLetter('failed-backup')

/**
 * Only the deployed host runs this: the dump is written to its disk with its own
 * `pg_dump`. A laptop subscribing here competes for production's backup jobs and
 * fails them on whatever client version happens to be installed.
 */
if (runsHostJobs()) {
  backup.work(async (payload) => {
    const backupService = new BackupService()
    await backupService.createBackup(payload.database)
  })
}
