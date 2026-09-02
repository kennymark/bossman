import { IconDatabaseOff, IconPlugConnectedX } from '@tabler/icons-react'

import type { AppEnv } from '#types/env'
import { AppCard } from '@/components/ui/app-card'
import { EmptyState } from '@/components/ui/empty-state'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'

/** Shown when the environment has no `MONGO_URL_*` set; nothing else on the page loads. */
export function JobStoreNotConfigured({ appEnv }: { appEnv: AppEnv }) {
  const variable = appEnv === 'prod' ? 'MONGO_URL_PROD' : 'MONGO_URL_DEV'

  return (
    <AppCard title='Job monitor not configured'>
      <EmptyState
        icon={IconDatabaseOff}
        title={`No job store for ${appEnv === 'prod' ? 'production' : 'development'}`}
        description={`Set ${variable} on the admin server to the Togetha app's MongoDB URL for this environment, then reload.`}
      />
    </AppCard>
  )
}

/** A request the store rejected or could not answer; the server has already logged why. */
export function JobStoreError({ error, title }: { error: ServerErrorResponse; title?: string }) {
  return (
    <AppCard title={title ?? 'Job store unavailable'}>
      <EmptyState
        icon={IconPlugConnectedX}
        title='Could not load jobs'
        description={serverErrorResponder(error) || 'The job store did not answer.'}
      />
    </AppCard>
  )
}
