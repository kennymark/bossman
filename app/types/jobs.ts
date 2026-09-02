import type { AppEnv } from '#types/env'
import type { PaginationMeta } from '#types/extra'
import type { JobStatus } from '#utils/jobs'

/** A job as the monitor sends it: ids as strings, dates as ISO, nothing from `data`. */
export interface JobRecord {
  id: string
  name: string
  type: string | null
  priority: number | null
  status: JobStatus
  lastRunAt: string | null
  nextRunAt: string | null
  lastFinishedAt: string | null
  lockedAt: string | null
  failedAt: string | null
  failCount: number
  failReason: string | null
  repeatInterval: string | null
  repeatTimezone: string | null
  progress: number | null
  runCount: number | null
  finishedCount: number | null
  shouldSaveResult: boolean
  lastModifiedBy: string | null
  disabled: boolean
  /** The job was re-queued from this console or from jobs-ui. */
  isRerun: boolean
}

/** The detail page adds the payload and result, both with credential-shaped keys redacted. */
export interface JobDetail extends JobRecord {
  data: unknown
  result: unknown
}

export interface JobStats {
  all: number
  failed: number
  scheduled: number
  recurring: number
  unique: number
  emails: number
  payments: number
  ranLastHour: number
  ranLastDay: number
  ranLastWeek: number
  ranLastMonth: number
  failedLastWeek: number
}

export interface JobHistoryPoint {
  /** YYYY-MM-DD, UTC. */
  date: string
  count: number
  failedCount: number
  topJob: { name: string; count: number } | null
}

export interface JobHistory {
  days: number
  from: string
  to: string
  name: string | null
  points: JobHistoryPoint[]
}

export interface JobListResponse {
  data: JobRecord[]
  meta: PaginationMeta
}

export interface JobMonitorStatus {
  env: AppEnv
  configured: boolean
}

export interface JobRerunResult {
  previousJobId: string
  newJobId: string
  name: string
}
