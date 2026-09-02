import logger from '@adonisjs/core/services/logger'
import {
  type Collection,
  type Document,
  type Filter,
  MongoClient,
  ObjectId,
  type Sort,
} from 'mongodb'

import { redactMetadata } from '#services/admin_audit_service'
import env from '#start/env'
import type { AppEnv } from '#types/env'
import type {
  JobDetail,
  JobHistory,
  JobHistoryPoint,
  JobListResponse,
  JobRecord,
  JobRerunResult,
  JobStats,
} from '#types/jobs'
import {
  buildRerunPayload,
  deriveJobStatus,
  escapeRegex,
  isJobId,
  type JobQueue,
  MAX_HISTORY_DAYS,
} from '#utils/jobs'
import { MAX_PER_PAGE } from '#utils/vine'

/**
 * Read access to the Togetha app's Pulse (Agenda) job store, per environment.
 *
 * The product runs `@pulsecron/pulse` against a MongoDB collection; this is the
 * console's window into it. One `MongoClient` per environment is created on first use
 * and kept for the life of the process, with a short server-selection timeout so an
 * unreachable store fails the request in seconds rather than hanging the page.
 *
 * Every method takes the environment the caller resolved with `request.appEnv()`;
 * nothing here reads the request.
 */

/** The collection Pulse is configured with in the product (`providers/worker_provider.ts`). */
export const JOBS_COLLECTION = 'agendaJobs'

const SERVER_SELECTION_TIMEOUT_MS = 5_000
const DEFAULT_PER_PAGE = 20

export class JobMonitorNotConfiguredError extends Error {
  constructor(public readonly appEnv: AppEnv) {
    super(`Job monitor is not configured for ${appEnv}`)
    this.name = 'JobMonitorNotConfiguredError'
  }
}

export class JobMonitorUnavailableError extends Error {
  constructor(
    public readonly appEnv: AppEnv,
    cause?: unknown,
  ) {
    super(`Job store for ${appEnv} could not be reached`, { cause })
    this.name = 'JobMonitorUnavailableError'
  }
}

export class JobNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Job ${id} not found`)
    this.name = 'JobNotFoundError'
  }
}

/** The subset of an Agenda job document this service reads. Everything else is passed through. */
interface JobDocument extends Document {
  _id: ObjectId
  name: string
  type?: string | null
  priority?: number | string | null
  nextRunAt?: Date | null
  lastRunAt?: Date | null
  lastFinishedAt?: Date | null
  lockedAt?: Date | null
  failedAt?: Date | null
  failCount?: number | null
  failReason?: string | null
  repeatInterval?: string | null
  repeatTimezone?: string | null
  data?: Record<string, unknown> | null
  result?: unknown
  progress?: number | null
  runCount?: number | null
  finishedCount?: number | null
  shouldSaveResult?: boolean | null
  lastModifiedBy?: string | null
  disabled?: boolean | null
}

export interface ListOptions {
  search?: string
  queue?: JobQueue
  page?: number
  perPage?: number
}

export interface HistoryOptions {
  days?: number
  name?: string
}

const clients = new Map<AppEnv, MongoClient>()

function urlFor(appEnv: AppEnv): string | undefined {
  const url = appEnv === 'prod' ? env.get('MONGO_URL_PROD') : env.get('MONGO_URL_DEV')
  return url?.trim() || undefined
}

/**
 * The jobs collection for an environment, connecting on first use.
 *
 * A client whose connection attempt failed is dropped so the next request starts
 * over rather than reusing a topology that already gave up.
 */
async function jobs(appEnv: AppEnv): Promise<Collection<JobDocument>> {
  const url = urlFor(appEnv)
  if (!url) throw new JobMonitorNotConfiguredError(appEnv)

  let client = clients.get(appEnv)
  if (!client) {
    client = new MongoClient(url, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      connectTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      maxPoolSize: 5,
    })
    clients.set(appEnv, client)
  }

  try {
    await client.connect()
  } catch (error) {
    clients.delete(appEnv)
    await client.close().catch(() => {})
    throw new JobMonitorUnavailableError(appEnv, error)
  }

  return client.db().collection<JobDocument>(JOBS_COLLECTION)
}

function hoursAgo(hours: number, from: Date): Date {
  return new Date(from.getTime() - hours * 60 * 60 * 1000)
}

function daysAgo(days: number, from: Date): Date {
  return hoursAgo(days * 24, from)
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function clamp(value: number | undefined, fallback: number, min: number, max: number): number {
  const n = Number.isFinite(value) ? Math.trunc(value as number) : fallback
  return Math.min(Math.max(n, min), max)
}

const FAILED_FILTER: Filter<JobDocument> = { failedAt: { $ne: null } }
const RECURRING_FILTER: Filter<JobDocument> = { repeatInterval: { $ne: null } }
const EMAILS_FILTER: Filter<JobDocument> = { name: { $regex: 'email', $options: 'i' } }
/** "payment" but not "email": Send Payment Reminder Email belongs to the mail queue. */
const PAYMENTS_FILTER: Filter<JobDocument> = {
  $and: [
    { name: { $regex: 'payment', $options: 'i' } },
    { name: { $not: { $regex: 'email', $options: 'i' } } },
  ],
}

function scheduledFilter(now: Date): Filter<JobDocument> {
  return { nextRunAt: { $gte: now } }
}

function queueFilter(queue: JobQueue, now: Date): Filter<JobDocument> {
  switch (queue) {
    case 'failed':
      return FAILED_FILTER
    case 'scheduled':
      return scheduledFilter(now)
    case 'recurring':
      return RECURRING_FILTER
    case 'emails':
      return EMAILS_FILTER
    case 'payments':
      return PAYMENTS_FILTER
    default:
      return {}
  }
}

/** A 24-hex term looks up one job by id; anything else is a literal, case-insensitive name match. */
function searchFilter(search: string | undefined): Filter<JobDocument> {
  const term = search?.trim()
  if (!term) return {}
  if (isJobId(term)) return { _id: new ObjectId(term) }
  return { name: { $regex: escapeRegex(term), $options: 'i' } }
}

function combine(...filters: Filter<JobDocument>[]): Filter<JobDocument> {
  const active = filters.filter((filter) => Object.keys(filter).length > 0)
  if (active.length === 0) return {}
  if (active.length === 1) return active[0]!
  return { $and: active }
}

/**
 * "The last run failed", as an aggregation expression.
 *
 * Same rule as `deriveJobStatus`: Agenda never clears `failedAt`, so only a failure
 * with no run started after it counts. Nulls sort below dates in BSON, which is what
 * makes `$gt: ['$failedAt', null]` a presence check.
 */
const LAST_RUN_FAILED_EXPR = {
  $and: [
    { $gt: ['$failedAt', null] },
    { $gte: ['$failedAt', { $ifNull: ['$lastRunAt', new Date(0)] }] },
  ],
}

function iso(value: unknown): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString()
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  return null
}

function integer(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function text(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

/**
 * BSON values (ObjectId, Date, Long…) as plain JSON, so the redaction pass sees
 * strings rather than driver objects it would otherwise flatten to `{}`.
 */
function toPlain(value: unknown): unknown {
  if (value === null || value === undefined) return null
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return null
  }
}

function serialiseJob(doc: JobDocument, now: Date): JobRecord {
  return {
    id: doc._id.toHexString(),
    name: String(doc.name ?? ''),
    type: text(doc.type),
    priority: integer(doc.priority),
    status: deriveJobStatus(doc, now),
    lastRunAt: iso(doc.lastRunAt),
    nextRunAt: iso(doc.nextRunAt),
    lastFinishedAt: iso(doc.lastFinishedAt),
    lockedAt: iso(doc.lockedAt),
    failedAt: iso(doc.failedAt),
    failCount: integer(doc.failCount) ?? 0,
    failReason: text(doc.failReason),
    repeatInterval: text(doc.repeatInterval),
    repeatTimezone: text(doc.repeatTimezone),
    progress: integer(doc.progress),
    runCount: integer(doc.runCount),
    finishedCount: integer(doc.finishedCount),
    shouldSaveResult: Boolean(doc.shouldSaveResult),
    lastModifiedBy: text(doc.lastModifiedBy),
    disabled: Boolean(doc.disabled),
    isRerun: Boolean(doc.data && typeof doc.data === 'object' && doc.data.reEnqueue),
  }
}

function serialiseDetail(doc: JobDocument, now: Date): JobDetail {
  return {
    ...serialiseJob(doc, now),
    data: redactMetadata(toPlain(doc.data)),
    result: redactMetadata(toPlain(doc.result)),
  }
}

function objectId(id: string): ObjectId {
  if (!isJobId(id)) throw new JobNotFoundError(id)
  return new ObjectId(id)
}

async function findOrFail(col: Collection<JobDocument>, id: string): Promise<JobDocument> {
  const doc = await col.findOne({ _id: objectId(id) })
  if (!doc) throw new JobNotFoundError(id)
  return doc
}

async function countUnique(col: Collection<JobDocument>, filter: Filter<JobDocument>) {
  const rows = await col
    .aggregate<{ total: number }>([
      { $match: filter },
      { $group: { _id: '$name' } },
      { $count: 'total' },
    ])
    .toArray()

  return rows[0]?.total ?? 0
}

/** Whether an environment has a job store URL at all. */
export function isConfigured(appEnv: AppEnv): boolean {
  return Boolean(urlFor(appEnv))
}

export async function stats(appEnv: AppEnv): Promise<JobStats> {
  const col = await jobs(appEnv)
  const now = new Date()

  const [
    all,
    failed,
    scheduled,
    recurring,
    emails,
    payments,
    unique,
    ranLastHour,
    ranLastDay,
    ranLastWeek,
    ranLastMonth,
    failedLastWeek,
  ] = await Promise.all([
    col.countDocuments({}),
    col.countDocuments(FAILED_FILTER),
    col.countDocuments(scheduledFilter(now)),
    col.countDocuments(RECURRING_FILTER),
    col.countDocuments(EMAILS_FILTER),
    col.countDocuments(PAYMENTS_FILTER),
    countUnique(col, {}),
    col.countDocuments({ lastFinishedAt: { $gte: hoursAgo(1, now) } }),
    col.countDocuments({ lastFinishedAt: { $gte: daysAgo(1, now) } }),
    col.countDocuments({ lastFinishedAt: { $gte: daysAgo(7, now) } }),
    col.countDocuments({ lastFinishedAt: { $gte: daysAgo(30, now) } }),
    col.countDocuments({ lastFinishedAt: { $gte: daysAgo(7, now) }, failCount: { $gte: 1 } }),
  ])

  return {
    all,
    failed,
    scheduled,
    recurring,
    unique,
    emails,
    payments,
    ranLastHour,
    ranLastDay,
    ranLastWeek,
    ranLastMonth,
    failedLastWeek,
  }
}

/**
 * One page of jobs.
 *
 * `unique` collapses the collection to the most recent document per name, which is
 * the view an operator wants when asking "what kinds of job exist, and when did each
 * last run?"; every other queue pages over raw documents.
 */
export async function list(appEnv: AppEnv, options: ListOptions = {}): Promise<JobListResponse> {
  const col = await jobs(appEnv)
  const now = new Date()
  const queue = options.queue ?? 'all'
  const perPage = clamp(options.perPage, DEFAULT_PER_PAGE, 1, MAX_PER_PAGE)
  const page = clamp(options.page, 1, 1, Number.MAX_SAFE_INTEGER)
  const skip = (page - 1) * perPage
  const filter = combine(queueFilter(queue, now), searchFilter(options.search))

  const meta = (total: number) => ({
    currentPage: page,
    perPage,
    total,
    lastPage: Math.max(Math.ceil(total / perPage), 1),
  })

  if (queue === 'unique') {
    const [docs, total] = await Promise.all([
      col
        .aggregate<JobDocument>([
          { $match: filter },
          { $sort: { lastRunAt: -1, _id: -1 } },
          { $group: { _id: '$name', doc: { $first: '$$ROOT' } } },
          { $replaceRoot: { newRoot: '$doc' } },
          { $sort: { lastRunAt: -1, _id: -1 } },
          { $skip: skip },
          { $limit: perPage },
        ])
        .toArray(),
      countUnique(col, filter),
    ])

    return { data: docs.map((doc) => serialiseJob(doc, now)), meta: meta(total) }
  }

  /** Scheduled reads soonest-first; everything else most-recently-run first. */
  const sort: Sort = queue === 'scheduled' ? { nextRunAt: 1, _id: 1 } : { lastRunAt: -1, _id: -1 }

  const [docs, total] = await Promise.all([
    col.find(filter).sort(sort).skip(skip).limit(perPage).toArray(),
    col.countDocuments(filter),
  ])

  return { data: docs.map((doc) => serialiseJob(doc, now)), meta: meta(total) }
}

/**
 * Jobs finished per UTC day, with how many of those runs failed and the busiest job
 * name. Days with no runs are filled in so the chart has a fixed width.
 */
export async function history(appEnv: AppEnv, options: HistoryOptions = {}): Promise<JobHistory> {
  const col = await jobs(appEnv)
  const days = clamp(options.days, 14, 1, MAX_HISTORY_DAYS)
  const to = new Date()
  const from = startOfUtcDay(to)
  from.setUTCDate(from.getUTCDate() - (days - 1))

  const name = options.name?.trim() || null
  const match: Filter<JobDocument> = { lastFinishedAt: { $gte: from, $lte: to } }
  if (name) match.name = name

  const rows = await col
    .aggregate<Omit<JobHistoryPoint, 'topJob'> & { topJob?: JobHistoryPoint['topJob'] }>([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$lastFinishedAt' } },
            name: '$name',
          },
          count: { $sum: 1 },
          failedCount: { $sum: { $cond: [LAST_RUN_FAILED_EXPR, 1, 0] } },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          count: { $sum: '$count' },
          failedCount: { $sum: '$failedCount' },
          jobs: { $push: { name: '$_id.name', count: '$count' } },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
          failedCount: 1,
          topJob: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$jobs',
                  cond: { $eq: ['$$this.count', { $max: '$jobs.count' }] },
                },
              },
              0,
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ])
    .toArray()

  const byDate = new Map(rows.map((row) => [row.date, row]))
  const points: JobHistoryPoint[] = []
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(from)
    day.setUTCDate(from.getUTCDate() + offset)
    const key = day.toISOString().slice(0, 10)
    const row = byDate.get(key)
    points.push({
      date: key,
      count: row?.count ?? 0,
      failedCount: row?.failedCount ?? 0,
      topJob: row?.topJob ?? null,
    })
  }

  return { days, from: from.toISOString(), to: to.toISOString(), name, points }
}

export async function detail(appEnv: AppEnv, id: string): Promise<JobDetail> {
  const col = await jobs(appEnv)
  const doc = await findOrFail(col, id)
  return serialiseDetail(doc, new Date())
}

/**
 * Re-queues a job by inserting a clone due now. The original is left untouched.
 */
export async function rerun(appEnv: AppEnv, id: string): Promise<JobRerunResult> {
  const col = await jobs(appEnv)
  const source = await findOrFail(col, id)

  const payload = buildRerunPayload(
    {
      name: source.name,
      data: source.data,
      priority: source.priority,
      shouldSaveResult: source.shouldSaveResult,
    },
    source._id.toHexString(),
  )

  const inserted = await col.insertOne(payload as unknown as JobDocument)

  return {
    previousJobId: source._id.toHexString(),
    newJobId: inserted.insertedId.toHexString(),
    name: source.name,
  }
}

/** Deletes one job and returns what it was, so the caller can record it. */
export async function remove(appEnv: AppEnv, id: string): Promise<JobRecord> {
  const col = await jobs(appEnv)
  const doc = await findOrFail(col, id)
  await col.deleteOne({ _id: doc._id })
  return serialiseJob(doc, new Date())
}

/** Closes every cached client. Safe to call when none were opened. */
export async function disconnectAll(): Promise<void> {
  const open = [...clients.entries()]
  clients.clear()
  await Promise.all(
    open.map(([appEnv, client]) =>
      client.close().catch((err) => logger.warn({ err, appEnv }, 'Job store client did not close')),
    ),
  )
}

const jobMonitor = {
  isConfigured,
  stats,
  list,
  history,
  detail,
  rerun,
  remove,
  disconnectAll,
}

export default jobMonitor
