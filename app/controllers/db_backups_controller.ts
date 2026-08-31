import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import drive from '@adonisjs/drive/services/main'
import { DateTime } from 'luxon'

import BackupRun from '#models/backup_run'
import DbBackup from '#models/db_backup'
import { recordAdminAction } from '#services/admin_audit_service'
import BackupService from '#services/backup_service'
import DbBackupTransformer from '#transformers/db_backup_transformer'
import { CONFIRMATION_PHRASES, confirmationMatches } from '#utils/confirmation'
import { paginatedIndex } from '#utils/paginated_index'
import {
  createBackupValidator,
  deleteBackupValidator,
  restoreBackupValidator,
  restorePreviewValidator,
} from '#validators/destructive'

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

    return inertia.render('db-backups/index', {
      ...pageProps,
      /** Drives the health panel; see `health()` for what it means. */
      health: inertia.defer(async () => this.buildHealth()) as never,
    })
  }

  /**
   * Backup health across both environments.
   *
   * Reads `backup_runs` in the admin database rather than `db_backups`, because the
   * latter only ever gets a row when a backup succeeds — a run that failed left no
   * trace at all, which is precisely the state an operator needs to see.
   */
  async health({ response }: HttpContext) {
    return response.ok(await this.buildHealth())
  }

  private async buildHealth() {
    const environments = await Promise.all(
      (['dev', 'prod'] as const).map(async (appEnv) => {
        const [lastSuccess, lastRun, recent] = await Promise.all([
          BackupRun.query()
            .where('appEnv', appEnv)
            .where('status', 'success')
            .orderBy('startedAt', 'desc')
            .first(),
          BackupRun.query().where('appEnv', appEnv).orderBy('startedAt', 'desc').first(),
          BackupRun.query()
            .where('appEnv', appEnv)
            .orderBy('startedAt', 'desc')
            .limit(20)
            .select('id', 'status', 'file_size', 'duration_ms', 'started_at', 'error'),
        ])

        const ageHours = lastSuccess?.startedAt
          ? DateTime.now().diff(lastSuccess.startedAt, 'hours').hours
          : null

        /**
         * The cron runs every 6 hours, so a gap beyond 12 means at least two runs were
         * missed or are failing silently.
         */
        const status =
          ageHours === null
            ? 'unknown'
            : ageHours <= 12
              ? 'healthy'
              : ageHours <= 36
                ? 'stale'
                : 'critical'

        const consecutiveFailures = countLeadingFailures(recent)

        return {
          appEnv,
          status,
          ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
          lastSuccessAt: lastSuccess?.startedAt?.toISO() ?? null,
          lastSuccessSize: lastSuccess?.fileSize ?? null,
          lastRunAt: lastRun?.startedAt?.toISO() ?? null,
          lastRunStatus: lastRun?.status ?? null,
          lastError: lastRun?.status === 'failed' ? lastRun.error : null,
          consecutiveFailures,
          history: recent
            .map((run) => ({
              id: run.id,
              status: run.status,
              fileSize: run.fileSize,
              durationMs: run.durationMs,
              startedAt: run.startedAt?.toISO() ?? null,
              error: run.error,
            }))
            .reverse(),
        }
      }),
    )

    return { environments }
  }

  /** API: create a new backup. Returns JSON. */
  async store(ctx: HttpContext) {
    const { request, response, auth } = ctx
    const appEnv = request.appEnv()
    const { reason } = await request.validateUsing(createBackupValidator)
    const actor = auth.getUserOrFail()

    try {
      const backup = await new BackupService().createBackup(appEnv, {
        trigger: 'manual',
        actor: { id: actor.id, email: actor.email },
      })

      await recordAdminAction(ctx, {
        action: 'backup.create',
        appEnv,
        targetType: 'DbBackup',
        targetId: backup.id,
        targetLabel: backup.fileName,
        reason: reason ?? null,
        metadata: { fileSize: backup.fileSize },
      })

      return response.ok({ success: true, backup: DbBackupTransformer.transform(backup) })
    } catch (err) {
      /**
       * Surfaced, not swallowed. `createBackup` used to catch everything and return
       * normally, so this endpoint answered `{ success: true }` for a backup that had
       * not happened.
       */
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ err, appEnv }, 'Manual backup failed')

      await recordAdminAction(ctx, {
        action: 'backup.create',
        appEnv,
        outcome: 'failed',
        error: message,
        reason: reason ?? null,
      })

      return response.internalServerError({
        success: false,
        error: 'The backup failed. Check the backup health panel and server logs.',
      })
    }
  }

  /** Download a backup file. */
  async download(ctx: HttpContext) {
    const { params, request, response } = ctx
    const appEnv = request.appEnv()
    const backup = await DbBackup.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    const fileName = backup.fileName

    if (!fileName) return response.notFound({ error: 'Backup has no stored file name' })

    const r2 = drive.use('backup')
    if (!(await r2.exists(fileName))) {
      return response.notFound({ error: 'Backup file not found in storage' })
    }

    await recordAdminAction(ctx, {
      action: 'backup.download',
      appEnv,
      targetType: 'DbBackup',
      targetId: backup.id,
      targetLabel: fileName,
    })

    /** Streamed: these files run to hundreds of megabytes. */
    response
      .header('Content-Type', 'application/sql')
      .header('Content-Disposition', `attachment; filename="${fileName}"`)
      .stream(await r2.getStream(fileName))
  }

  /**
   * Dry run: what a restore of this backup would do, without touching any database.
   */
  async restorePreview(ctx: HttpContext) {
    const { params, request, response } = ctx
    const appEnv = request.appEnv()
    const backupId = Number(params.id)
    if (!Number.isInteger(backupId)) return response.badRequest({ error: 'Invalid backup ID' })

    const { target } = await request.validateUsing(restorePreviewValidator)

    try {
      const preview = await new BackupService().inspect(backupId, appEnv)

      await recordAdminAction(ctx, {
        action: 'backup.restore_preview',
        appEnv,
        targetType: 'DbBackup',
        targetId: backupId,
        targetLabel: preview.fileName,
        metadata: {
          target,
          destructiveTableCount: preview.destructiveTables.length,
          tablesCopied: preview.tablesCopied.length,
        },
      })

      return response.ok({
        ...preview,
        target,
        /** What the operator must retype to proceed. */
        confirmationPhrase: CONFIRMATION_PHRASES['backup.restore'](target),
      })
    } catch (err) {
      logger.error({ err, backupId }, 'Restore preview failed')
      return response.badRequest({
        error: err instanceof Error ? err.message : 'Could not read the backup file',
      })
    }
  }

  /** API: restore a backup into one of the configured databases. */
  async restore(ctx: HttpContext) {
    const { params, request, response, auth } = ctx
    const appEnv = request.appEnv()
    const backupId = Number(params.id)
    if (!Number.isInteger(backupId)) return response.badRequest({ error: 'Invalid backup ID' })

    const { target, reason, confirm } = await request.validateUsing(restoreBackupValidator)

    /**
     * A restore overwrites a live database, so the operator retypes the target name.
     * Checked server-side: the dialog is a convenience, this is the control.
     */
    const expected = CONFIRMATION_PHRASES['backup.restore'](target)
    if (!confirmationMatches(confirm, expected)) {
      return response.badRequest({
        error: `Type "${expected}" to confirm this restore.`,
        type: 'confirmation',
      })
    }

    /** Only a god admin may overwrite production, whatever else they can reach. */
    const user = auth.getUserOrFail()
    if (target === 'prod' && !user.isGodAdmin) {
      await recordAdminAction(ctx, {
        action: 'backup.restore',
        appEnv,
        targetType: 'DbBackup',
        targetId: backupId,
        outcome: 'failed',
        reason,
        error: 'Not a god admin',
        metadata: { target },
      })
      return response.forbidden({ error: 'Only a god admin may restore into production.' })
    }

    try {
      logger.info({ backupId, target }, 'Restoring backup')
      await new BackupService().restore(backupId, target, appEnv)

      await recordAdminAction(ctx, {
        action: 'backup.restore',
        appEnv,
        targetType: 'DbBackup',
        targetId: backupId,
        targetLabel: `→ ${target}`,
        reason,
        metadata: { target },
      })

      return response.ok({ success: true, message: 'Restore completed successfully' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ err, backupId, target }, 'Restore failed')

      await recordAdminAction(ctx, {
        action: 'backup.restore',
        appEnv,
        targetType: 'DbBackup',
        targetId: backupId,
        outcome: 'failed',
        reason,
        error: message,
        metadata: { target },
      })

      return response.badRequest({ success: false, error: message })
    }
  }

  async destroy(ctx: HttpContext) {
    const { params, response, request, session } = ctx
    const appEnv = request.appEnv()
    const backup = await DbBackup.query({ connection: appEnv }).where('id', params.id).firstOrFail()
    const fileName = backup.fileName

    const { reason, confirm } = await request.validateUsing(deleteBackupValidator)
    const expected = CONFIRMATION_PHRASES['backup.delete']()
    if (!confirmationMatches(confirm, expected)) {
      session.flash('error', { message: `Type "${expected}" to confirm.` })
      return response.redirect('/db-backups')
    }

    if (!fileName) {
      session.flash('error', { message: 'Backup has no stored file name.' })
      return response.redirect('/db-backups')
    }

    try {
      await drive.use('backup').delete(fileName)
      await backup.delete()
      logger.info(`Deleted backup file from R2: ${fileName}`)

      await recordAdminAction(ctx, {
        action: 'backup.delete',
        appEnv,
        targetType: 'DbBackup',
        targetId: params.id,
        targetLabel: fileName,
        reason,
      })

      session.flash('success', { message: 'Backup deleted.' })
    } catch (err) {
      /** Previously swallowed, so a failed delete still redirected as if it had worked. */
      logger.error({ err, fileName }, 'Failed to delete backup')

      await recordAdminAction(ctx, {
        action: 'backup.delete',
        appEnv,
        targetType: 'DbBackup',
        targetId: params.id,
        targetLabel: fileName,
        outcome: 'failed',
        reason,
        error: err instanceof Error ? err.message : String(err),
      })

      session.flash('error', { message: 'Could not delete the backup. Please try again.' })
    }

    return response.redirect('/db-backups')
  }
}

/** Failures at the head of a newest-first run list. */
function countLeadingFailures(runs: { status: string }[]): number {
  let count = 0
  for (const run of runs) {
    if (run.status === 'failed') count++
    else if (run.status === 'success') break
  }
  return count
}
