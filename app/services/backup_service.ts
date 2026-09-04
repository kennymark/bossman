import { spawn } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import drive from '@adonisjs/drive/services/main'
import { DateTime } from 'luxon'

import BackupRun, { type BackupRunTrigger } from '#models/backup_run'
import DatabaseBackup from '#models/db_backup'
import { SnitchService } from '#services/snitch_service'
import env from '#start/env'
import { type AppEnv, RESTORE_TARGETS, type RestoreTarget } from '#types/env'

export { RESTORE_TARGETS }
export type { AppEnv, RestoreTarget }

export interface BackupActor {
  id: string
  email: string
}

export interface CreateBackupOptions {
  trigger?: BackupRunTrigger
  actor?: BackupActor | null
}

/** How many dump files may sit on local disk before the oldest are pruned. */
const LOCAL_BACKUP_RETENTION = 2

/** pg_dump / psql are killed if they outlive this, so a hung run cannot pin the worker. */
const PG_COMMAND_TIMEOUT_MS = 30 * 60 * 1000

function connectionStringFor(target: AppEnv): string {
  const url = target === 'prod' ? env.get('PROD_DB') : env.get('DEV_DB')
  if (!url) throw new Error(`No connection string configured for the "${target}" database`)
  return url
}

/**
 * Splits a connection URL into libpq environment variables.
 *
 * Passing the URL as an argument put the password into the process table, where any
 * other process on the host could read it. libpq reads these instead, and the child
 * process gets nothing else from the parent environment that it needs.
 */
function libpqEnvFor(connectionString: string): NodeJS.ProcessEnv {
  const url = new URL(connectionString)
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''))
  const sslmode = url.searchParams.get('sslmode')

  const pgEnv: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    PGHOST: decodeURIComponent(url.hostname),
    PGPORT: url.port || '5432',
    PGDATABASE: database,
    PGCONNECT_TIMEOUT: '15',
  }

  if (url.username) pgEnv.PGUSER = decodeURIComponent(url.username)
  if (url.password) pgEnv.PGPASSWORD = decodeURIComponent(url.password)
  if (sslmode) pgEnv.PGSSLMODE = sslmode

  return pgEnv
}

interface RunPgCommandOptions {
  /** Where stdout goes. Omit to discard it. */
  stdoutTo?: fs.WriteStream
}

/**
 * Runs a PostgreSQL client binary with no shell involved.
 *
 * The dump used to run through `execSync` with the connection string interpolated into
 * a shell string alongside a `>` redirect, so any metacharacter in a password broke the
 * command — or worse. Arguments are passed as an array and the redirect is a real file
 * descriptor.
 */
/**
 * Turns a failed `pg_dump`/`psql` into something an operator can act on.
 *
 * The version mismatch is worth naming: `pg_dump` refuses to dump a server newer than
 * itself, and the raw message says only that the versions differ. A client of the
 * server's major version or newer works, so the advice is a floor rather than an exact
 * version — and on the deployed host it points at the image's Postgres client, not at
 * anything in this app's configuration.
 */
export function explainPgFailure(bin: string, code: number | null, stderr: string): string {
  const base = `${bin} exited with code ${code}: ${stderr}`
  const mismatch = stderr.match(/server version:\s*(\d+)[^\n]*?;\s*\w+ version:\s*(\d+)/i)
  if (!mismatch) return base

  const [, server, client] = mismatch
  return `${base}\n\n${bin} ${client} cannot read a PostgreSQL ${server} server. A client of ${server} or newer can: install one on this host (macOS: brew install postgresql@${server}) and put its bin directory first on PATH.`
}

function runPgCommand(
  bin: 'pg_dump' | 'psql',
  args: string[],
  connectionString: string,
  options: RunPgCommandOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      env: libpqEnvFor(connectionString),
      stdio: ['ignore', options.stdoutTo ? 'pipe' : 'ignore', 'pipe'],
    })

    let stderr = ''
    let settled = false

    const finish = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (err) reject(err)
      else resolve()
    }

    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      finish(new Error(`${bin} timed out after ${PG_COMMAND_TIMEOUT_MS}ms`))
    }, PG_COMMAND_TIMEOUT_MS)

    child.stderr?.on('data', (chunk) => {
      /** Bounded: a failing restore can emit an error per statement. */
      if (stderr.length < 8000) stderr += String(chunk)
    })

    if (options.stdoutTo && child.stdout) {
      child.stdout.pipe(options.stdoutTo)
      options.stdoutTo.on('error', (err) => {
        child.kill('SIGKILL')
        finish(err)
      })
    }

    child.on('error', (err) =>
      finish(
        new Error(
          `Could not run ${bin}: ${err.message}. Is postgresql-client installed on this host?`,
        ),
      ),
    )

    child.on('close', (code) => {
      if (code === 0) return finish()
      finish(new Error(explainPgFailure(bin, code, stderr.trim().slice(0, 2000))))
    })
  })
}

export default class BackupService {
  /** Directory dumps are written to before upload. */
  private backupDir(): string {
    return app.makePath('backups')
  }

  /**
   * Dump a database and upload it to object storage.
   *
   * Throws on failure. The previous implementation caught every error, logged it, and
   * returned normally — so the controller answered `{ success: true }` and pg-boss
   * never retried, for a backup that had not happened.
   */
  async createBackup(
    selectedDb: AppEnv,
    options: CreateBackupOptions = {},
  ): Promise<DatabaseBackup> {
    const { trigger = 'schedule', actor = null } = options
    const startedAt = DateTime.now()

    const run = await BackupRun.create({
      appEnv: selectedDb,
      status: 'running',
      trigger,
      triggeredById: actor?.id ?? null,
      triggeredByEmail: actor?.email ?? null,
      startedAt,
    })

    const backupDir = this.backupDir()
    const backupFileName = `v2-backup-${Date.now()}-${selectedDb}.sql`
    const backupFilePath = path.join(backupDir, backupFileName)

    try {
      await fsp.mkdir(backupDir, { recursive: true })

      logger.info({ selectedDb, backupFileName }, 'Initiating DB backup')

      const out = fs.createWriteStream(backupFilePath)
      try {
        await runPgCommand('pg_dump', ['--no-owner', '--no-acl'], connectionStringFor(selectedDb), {
          stdoutTo: out,
        })
      } finally {
        out.close()
      }

      const { size } = await fsp.stat(backupFilePath)
      if (size === 0) throw new Error('pg_dump produced an empty file')

      /**
       * Streamed, not `readFileSync`. A production dump is hundreds of megabytes and
       * reading it into a Buffer first put the whole thing in the heap.
       */
      logger.info({ backupFileName, size }, 'Uploading backup to Cloudflare R2')
      await drive.use('backup').putStream(backupFileName, fs.createReadStream(backupFilePath))

      const backup = await DatabaseBackup.create(
        { filePath: backupFilePath, fileSize: size },
        { connection: selectedDb },
      )

      run.merge({
        status: 'success',
        storageKey: backupFileName,
        fileSize: size,
        finishedAt: DateTime.now(),
        durationMs: Math.round(DateTime.now().diff(startedAt).toMillis()),
      })
      await run.save()

      await SnitchService.report.general(
        `DB backup completed (${selectedDb}) at ${startedAt.toISO()}`,
        { backupFileName, selectedDb, size },
      )

      logger.info({ backupId: backup.id, selectedDb }, 'Backup completed')

      /** Local copies are a cache, not the artefact — R2 holds the real thing. */
      await this.pruneLocalBackups()

      return backup
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)

      run.merge({
        status: 'failed',
        error: message.slice(0, 2000),
        finishedAt: DateTime.now(),
        durationMs: Math.round(DateTime.now().diff(startedAt).toMillis()),
      })
      await run
        .save()
        .catch((saveErr) => logger.error({ err: saveErr }, 'Could not record backup failure'))

      /** A partial dump is worse than none — it would upload and look valid. */
      await fsp.rm(backupFilePath, { force: true }).catch(() => {})

      logger.error({ err, selectedDb }, 'Backup run failed')
      await SnitchService.report
        .critical(`DB backup FAILED (${selectedDb}): ${message}`, { selectedDb })
        .catch(() => {})

      throw err instanceof Error ? err : new Error(message)
    }
  }

  /**
   * Deletes all but the most recent local dumps.
   *
   * Nothing ever removed these. On this repo they had reached 550MB across 38 files,
   * and in a container they sit on an ephemeral disk that eventually fills.
   */
  async pruneLocalBackups(keep: number = LOCAL_BACKUP_RETENTION): Promise<number> {
    const backupDir = this.backupDir()

    let entries: string[]
    try {
      entries = await fsp.readdir(backupDir)
    } catch {
      return 0
    }

    const files = await Promise.all(
      entries
        .filter((name) => name.endsWith('.sql'))
        .map(async (name) => {
          const fullPath = path.join(backupDir, name)
          try {
            const stat = await fsp.stat(fullPath)
            return { fullPath, mtimeMs: stat.mtimeMs }
          } catch {
            return null
          }
        }),
    )

    const sorted = files
      .filter((file): file is { fullPath: string; mtimeMs: number } => file !== null)
      .sort((a, b) => b.mtimeMs - a.mtimeMs)

    let removed = 0
    for (const file of sorted.slice(Math.max(keep, 0))) {
      try {
        await fsp.rm(file.fullPath, { force: true })
        removed++
      } catch (err) {
        logger.warn({ err, file: file.fullPath }, 'Could not prune local backup')
      }
    }

    if (removed) logger.info({ removed, keep }, 'Pruned local backup files')
    return removed
  }

  /**
   * Restore a stored backup into one of the configured databases.
   *
   * @param backupId - ID of the backup record
   * @param target - Named database to restore into; the URL comes from the server env
   * @param appEnv - DB connection the backup record is read from
   */
  async restore(backupId: number, target: RestoreTarget, appEnv: AppEnv): Promise<void> {
    const { fileName, tempFilePath } = await this.downloadToTemp(backupId, appEnv, 'restore')

    try {
      logger.info({ fileName, target }, 'Restoring backup to target database')
      await runPgCommand(
        'psql',
        ['--set', 'ON_ERROR_STOP=1', '-f', tempFilePath],
        connectionStringFor(target),
      )
      logger.info({ fileName, target }, 'Restore completed successfully')
    } finally {
      await fsp.rm(tempFilePath, { force: true }).catch(() => {})
    }
  }

  /**
   * Parses a backup without applying it, so an operator can see what a restore would
   * touch before running one against a live database.
   */
  async inspect(backupId: number, appEnv: AppEnv): Promise<RestorePreview> {
    const { fileName, tempFilePath, fileSize } = await this.downloadToTemp(
      backupId,
      appEnv,
      'inspect',
    )

    try {
      const sql = await fsp.readFile(tempFilePath, 'utf-8')
      return summariseDump(sql, { fileName, fileSize })
    } finally {
      await fsp.rm(tempFilePath, { force: true }).catch(() => {})
    }
  }

  private async downloadToTemp(backupId: number, appEnv: AppEnv, purpose: string) {
    const backup = await DatabaseBackup.query({ connection: appEnv })
      .where('id', backupId)
      .firstOrFail()

    const fileName = backup.fileName
    if (!fileName) throw new Error(`Backup ${backupId} has no stored file name`)

    const r2 = drive.use('backup')
    if (!(await r2.exists(fileName))) {
      throw new Error(`Backup file not found in storage: ${fileName}`)
    }

    const tempFilePath = path.join(app.tmpPath(), `${purpose}-${Date.now()}-${fileName}`)
    await fsp.mkdir(path.dirname(tempFilePath), { recursive: true })

    /** Streamed for the same reason the upload is: these files are large. */
    await pipeline(await r2.getStream(fileName), fs.createWriteStream(tempFilePath))

    const { size } = await fsp.stat(tempFilePath)
    return { fileName, tempFilePath, fileSize: size }
  }
}

export interface RestorePreview {
  fileName: string
  fileSize: number
  statementCount: number
  /** Tables the dump drops or truncates — the destructive part of a restore. */
  destructiveTables: string[]
  tablesCreated: string[]
  tablesCopied: string[]
  warnings: string[]
}

/**
 * Reads a plain-format pg_dump and reports what applying it would do.
 *
 * Deliberately a text scan rather than a real parse: the goal is an operator-facing
 * summary of the destructive statements, not a guarantee.
 */
export function summariseDump(
  sql: string,
  meta: { fileName: string; fileSize: number },
): RestorePreview {
  const destructive = new Set<string>()
  const created = new Set<string>()
  const copied = new Set<string>()
  const warnings: string[] = []

  const dropRe = /^\s*DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([^\s;]+)/gim
  const truncateRe = /^\s*TRUNCATE\s+(?:TABLE\s+)?([^\s;]+)/gim
  const createRe = /^\s*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/gim
  const copyRe = /^\s*COPY\s+([^\s(]+)/gim

  for (const match of sql.matchAll(dropRe)) destructive.add(cleanIdentifier(match[1]))
  for (const match of sql.matchAll(truncateRe)) destructive.add(cleanIdentifier(match[1]))
  for (const match of sql.matchAll(createRe)) created.add(cleanIdentifier(match[1]))
  for (const match of sql.matchAll(copyRe)) copied.add(cleanIdentifier(match[1]))

  if (/^\s*DROP\s+SCHEMA/im.test(sql)) warnings.push('Dump drops one or more schemas.')
  if (/^\s*DROP\s+DATABASE/im.test(sql)) warnings.push('Dump drops a database.')
  if (!created.size && !copied.size) {
    warnings.push('No CREATE TABLE or COPY statements found — this may not be a valid dump.')
  }

  return {
    fileName: meta.fileName,
    fileSize: meta.fileSize,
    statementCount: (sql.match(/;\s*$/gm) || []).length,
    destructiveTables: [...destructive].sort(),
    tablesCreated: [...created].sort(),
    tablesCopied: [...copied].sort(),
    warnings,
  }
}

function cleanIdentifier(raw: string): string {
  return raw.replace(/["`]/g, '').replace(/^public\./, '')
}
