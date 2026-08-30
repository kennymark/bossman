import logger from '@adonisjs/core/services/logger'
import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import type { DateTime } from 'luxon'

import boss from '#services/boss_service'

type VineSchema = Parameters<typeof vine.validate>[0]['schema']

/** When to run a one-off job: now (omit), at a Date/DateTime, after N seconds, or at an ISO string. */
export type ScheduleWhen = Date | DateTime | number | string

function normalizeWhen(when: ScheduleWhen): Date | number | string {
  if (typeof when === 'number' || typeof when === 'string' || when instanceof Date) return when
  return (when as DateTime).toJSDate()
}

export interface RetryOptions {
  limit: number
  backoff?: boolean
  delay: number
}

export interface JobDefinition<T = object> {
  name: string
  inputSchema?: VineSchema
  retry?: RetryOptions
  deadLetterQueue?: string
  workHandler?: (payload: T & { id: string }) => void | Promise<void>
}

export interface TypedBuilder<Schema extends VineSchema> {
  retry(options: RetryOptions): TypedBuilder<Schema>
  deadLetter(queueName: string): TypedBuilder<Schema>
  work(
    handler: (payload: Infer<Schema> & { id: string }) => void | Promise<void>,
  ): TypedBuilder<Schema>
  schedule(data: Infer<Schema>, when?: ScheduleWhen): Promise<string | null>
  scheduleCron(cron: string, data: Infer<Schema>): Promise<void>
  cancel(jobId: string): Promise<void>
}

const jobDefinitions: JobDefinition[] = []

function createJob(name: string) {
  const definition: JobDefinition = { name }
  jobDefinitions.push(definition)

  const builder = {
    input<Schema extends VineSchema>(schema: Schema): TypedBuilder<Schema> {
      definition.inputSchema = schema
      const typed: TypedBuilder<Schema> = {
        retry(options) {
          definition.retry = options
          return typed
        },
        deadLetter(queueName) {
          definition.deadLetterQueue = queueName
          return typed
        },
        work(handler) {
          definition.workHandler = handler as JobDefinition['workHandler']
          const queueOptions = {
            retryLimit: definition.retry?.limit,
            retryDelay: definition.retry?.delay,
            retryBackoff: definition.retry?.backoff,
            deadLetter: definition.deadLetterQueue,
          }
          boss.registerWork({
            queueName: definition.name,
            queueOptions,
            handler: async (jobs) => {
              /**
               * Each job in the batch is isolated. Without this, one job throwing (a
               * validation failure, say) aborted the rest of the batch, so unrelated
               * jobs were silently skipped rather than retried on their own terms.
               */
              const results = await Promise.allSettled(
                jobs.map(async (job) => {
                  const data = definition.inputSchema
                    ? await vine.validate({ schema: definition.inputSchema, data: job.data })
                    : (job.data as object)
                  await definition.workHandler?.({ ...data, id: job.id })
                }),
              )

              const failures = results.filter((r) => r.status === 'rejected')
              for (const failure of failures) {
                logger.error({ err: failure.reason, queue: definition.name }, 'Job failed')
              }

              /** Rethrow so pg-boss still retries the batch's failed jobs. */
              if (failures.length) throw failures[0].reason
            },
          })
          return typed
        },
        async schedule(data: Infer<Schema>, when?: ScheduleWhen) {
          const validated = definition.inputSchema
            ? await vine.validate({ schema: definition.inputSchema, data })
            : data
          await boss.start()
          const options = {
            retryLimit: definition.retry?.limit,
            retryDelay: definition.retry?.delay,
            retryBackoff: definition.retry?.backoff,
            deadLetter: definition.deadLetterQueue,
          }
          if (when === undefined) return boss.send(definition.name, validated, options)
          return boss.sendAfter(definition.name, validated, options, normalizeWhen(when))
        },
        async scheduleCron(cron: string, data: Infer<Schema>) {
          const validated = definition.inputSchema
            ? await vine.validate({ schema: definition.inputSchema, data })
            : data
          await boss.schedule(definition.name, cron, validated)
        },
        async cancel(jobId: string) {
          await boss.cancel(definition.name, jobId)
        },
      }
      return typed
    },
  }
  return builder
}

async function ensureStarted() {
  await boss.start()
  logger.info('Boss started')
}

export const worker = {
  createJob,
  ensureStarted,
}
