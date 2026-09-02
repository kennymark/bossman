/**
 * Pure helpers for the Pulse/Agenda job monitor.
 *
 * Client-safe: no AdonisJS services and no driver imports, so the jobs pages can
 * derive a job's status exactly the way the server does. See `agent.md` — anything
 * `inertia/` imports must stay free of container-resolving services.
 */

/** The filters the jobs page offers, mirroring the standalone jobs-ui dashboard. */
export const JOB_QUEUES = [
  'all',
  'unique',
  'failed',
  'scheduled',
  'recurring',
  'emails',
  'payments',
] as const
export type JobQueue = (typeof JOB_QUEUES)[number]

export const JOB_STATUSES = [
  'running',
  'failed',
  'queued',
  'scheduled',
  'completed',
  'idle',
] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

/** How far back the history chart may look; one aggregation per request. */
export const MAX_HISTORY_DAYS = 30
export const DEFAULT_HISTORY_DAYS = 14

/** Who a re-queued clone says it came from. Replaces jobs-ui's `enQueuedFromJobsUI`. */
export const RERUN_SOURCE = 'togetha-admin'

const OBJECT_ID = /^[0-9a-fA-F]{24}$/

/**
 * A MongoDB ObjectId as a hex string.
 *
 * Checked before any id reaches the driver: `new ObjectId('...')` throws on anything
 * else, and that throw used to surface as a 500 from a mistyped URL.
 */
export function isJobId(value: unknown): value is string {
  return typeof value === 'string' && OBJECT_ID.test(value)
}

/**
 * Escapes regex metacharacters so a search term is matched literally.
 *
 * The name search is a case-insensitive `$regex`; without this `?search=.*` matched
 * every job and `?search=(` was a driver error.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
}

type DateLike = string | number | Date | null | undefined

function toDate(value: DateLike): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export interface JobStatusInput {
  lockedAt?: DateLike
  failedAt?: DateLike
  lastRunAt?: DateLike
  nextRunAt?: DateLike
  lastFinishedAt?: DateLike
}

/**
 * One status from the handful of timestamps Agenda keeps on a job.
 *
 * Agenda never clears `failedAt`, so a job that failed once and has run cleanly since
 * still carries it. A failure only counts when no run has *started* after it, which is
 * what `failedAt >= lastRunAt` says. A future `nextRunAt` is scheduled; one in the past
 * is due and waiting for a worker to pick it up.
 */
export function deriveJobStatus(job: JobStatusInput, now: Date = new Date()): JobStatus {
  if (toDate(job.lockedAt)) return 'running'

  const failedAt = toDate(job.failedAt)
  const lastRunAt = toDate(job.lastRunAt)
  if (failedAt && (!lastRunAt || failedAt.getTime() >= lastRunAt.getTime())) return 'failed'

  const nextRunAt = toDate(job.nextRunAt)
  if (nextRunAt) return nextRunAt.getTime() > now.getTime() ? 'scheduled' : 'queued'

  if (toDate(job.lastFinishedAt)) return 'completed'

  return 'idle'
}

export interface RerunSource {
  name: string
  data?: Record<string, unknown> | null
  priority?: number | string | null
  shouldSaveResult?: boolean | null
}

/**
 * The document a re-run inserts.
 *
 * A re-run is a fresh one-off job, not an edit of the old one: the original keeps its
 * history and the clone records where it came from in `data`, the same way jobs-ui did
 * (`reEnqueue`, `previousJobId`). `type: 'normal'` and a null `repeatInterval` stop a
 * cloned recurring job from becoming a second schedule.
 */
export function buildRerunPayload(job: RerunSource, previousJobId: string, now = new Date()) {
  return {
    name: job.name,
    type: 'normal',
    priority: typeof job.priority === 'number' ? job.priority : 0,
    progress: 0,
    repeatInterval: null,
    repeatTimezone: null,
    nextRunAt: now,
    lockedAt: null,
    lastRunAt: null,
    lastFinishedAt: null,
    failedAt: null,
    failCount: 0,
    failReason: null,
    shouldSaveResult: Boolean(job.shouldSaveResult),
    lastModifiedBy: RERUN_SOURCE,
    data: {
      ...(job.data ?? {}),
      reEnqueue: true,
      enqueuedFromAdmin: true,
      previousJobId,
    },
  }
}
