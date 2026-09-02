import { usePage } from '@inertiajs/react'
import { useCallback, useEffect, useState } from 'react'

import api from '@/lib/http'

type AppEnv = 'prod' | 'dev'

export function useEnvironment() {
  const page = usePage()
  const sharedAppEnv = (page.props.appEnv as AppEnv | undefined) ?? 'dev'
  const [environment, setEnvironmentState] = useState<AppEnv>(sharedAppEnv)

  useEffect(() => {
    setEnvironmentState(sharedAppEnv)
  }, [sharedAppEnv])

  const setEnvironment = useCallback(
    async (value: AppEnv | ((prev: AppEnv) => AppEnv)) => {
      const next = typeof value === 'function' ? value(environment) : value
      setEnvironmentState(next)
      try {
        await api.appEnv.update({ body: { appEnv: next } })
        window.location.reload()
      } catch {
        setEnvironmentState(environment)
      }
    },
    [environment],
  )

  return { environment, setEnvironment }
}
