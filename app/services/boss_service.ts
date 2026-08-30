import logger from '@adonisjs/core/services/logger'
import { PgBoss } from 'pg-boss'

import config from '#config/boss'

export interface BossQueueOptions {
  retryLimit?: number
  retryDelay?: number
  retryBackoff?: boolean
  retryDelayMax?: number
  deadLetter?: string
}

export interface BossWorkRegistration {
  queueName: string
  queueOptions: BossQueueOptions
  handler: (jobs: { id: string; data: unknown }[]) => Promise<void>
}

let instance: PgBoss | null = null
let started = false
const workRegistrations: BossWorkRegistration[] = []

function getBoss(): PgBoss {
  if (!instance) {
    instance = new PgBoss({
      connectionString: config.connectionString,
      schema: config.schema,
    })
  }
  return instance
}

/**
 * Start pg-boss (create schema, start workers). Call once before sending or scheduling jobs.
 * When running workers, call this so that registered work handlers are attached.
 */
async function start(): Promise<PgBoss> {
  const boss = getBoss()
  await boss.start()
  if (!started) {
    started = true
    const deadLetterQueues = new Set(
      workRegistrations
        .map((r) => r.queueOptions.deadLetter)
        .filter((name): name is string => name !== undefined),
    )
    for (const name of deadLetterQueues) {
      await boss.createQueue(name, {})
    }
    for (const reg of workRegistrations) {
      const opts: Record<string, unknown> = {}
      if (reg.queueOptions.retryLimit !== undefined) opts.retryLimit = reg.queueOptions.retryLimit
      if (reg.queueOptions.retryDelay !== undefined) opts.retryDelay = reg.queueOptions.retryDelay
      if (reg.queueOptions.retryBackoff !== undefined)
        opts.retryBackoff = reg.queueOptions.retryBackoff
      if (
        reg.queueOptions.retryDelayMax !== undefined &&
        Number.isInteger(reg.queueOptions.retryDelayMax) &&
        reg.queueOptions.retryDelayMax >= 0
      ) {
        opts.retryDelayMax = reg.queueOptions.retryDelayMax
      }
      if (reg.queueOptions.deadLetter !== undefined) opts.deadLetter = reg.queueOptions.deadLetter
      logger.debug(`Registering worker for queue: ${reg.queueName}`)
      await boss.createQueue(reg.queueName, opts)
      await boss.work(reg.queueName, reg.handler)
    }
  }
  return boss
}

/**
 * Register a work handler (used by boss/base). Queues are created and workers attached when start() is called.
 */
function registerWork(registration: BossWorkRegistration): void {
  workRegistrations.push(registration)
}

/**
 * Send a job to a queue. Options can override retry/deadLetter per job.
 */
async function send<T extends object>(
  name: string,
  data?: T | null,
  options?: BossQueueOptions & { startAfter?: number | Date | string },
): Promise<string | null> {
  await start()
  return getBoss().send(name, data ?? null, options ?? undefined)
}

/**
 * Schedule a recurring job with a cron expression.
 */
async function schedule(
  name: string,
  cron: string,
  data?: object | null,
  options?: { tz?: string },
): Promise<void> {
  await start()
  await getBoss().schedule(name, cron, data ?? null, options)
}

/**
 * Send a job to run after a delay (seconds or Date).
 */
async function sendAfter<T extends object>(
  name: string,
  data: T | null,
  options: BossQueueOptions | null,
  after: number | Date | string,
): Promise<string | null> {
  await start()
  const boss = getBoss()
  if (typeof after === 'number') return boss.sendAfter(name, data, options, after)
  if (after instanceof Date) return boss.sendAfter(name, data, options, after)
  return boss.sendAfter(name, data, options, after)
}

const bossService = {
  getBoss,
  start,
  registerWork,
  send,
  sendAfter,
  schedule,
  cancel: async (name: string, id: string) => {
    await start()
    await getBoss().cancel(name, id)
  },
}

export default bossService
