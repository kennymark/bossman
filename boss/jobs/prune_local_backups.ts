import vine from '@vinejs/vine'

import { worker } from '#boss/base'
import BackupService from '#services/backup_service'

/**
 * Sweeps stale dump files off local disk.
 *
 * `createBackup` prunes after a successful run, but a run that crashes between writing
 * the dump and uploading it leaves the file behind. Nothing used to clean these up at
 * all: they had grown to 550MB across 38 files, on a container disk that is not sized
 * for it.
 */
export const pruneLocalBackups = worker
  .createJob('prune-local-backups')
  .input(vine.object({ keep: vine.number().min(0).max(50).optional() }))
  .retry({ limit: 3, delay: 60, backoff: true })

pruneLocalBackups.work(async (payload) => {
  await new BackupService().pruneLocalBackups(payload.keep ?? 2)
})
