export type AppEnv = 'dev' | 'prod'

/**
 * The only databases a restore may target.
 *
 * Client-safe so the restore dialog offers exactly the set the server accepts. The
 * restore endpoint used to take a PostgreSQL connection URL straight from the request
 * body; the URL behind each name now comes from the server's own environment.
 */
export const RESTORE_TARGETS = ['dev', 'prod'] as const
export type RestoreTarget = (typeof RESTORE_TARGETS)[number]
