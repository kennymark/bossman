import { IconRefresh } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import api from '@/lib/http'

export interface RefreshRailwayButtonProps {
  /** Called after the server cache is dropped, to re-pull the page's own data. */
  onRefreshed?: () => void
}

/**
 * Drops the server-side Railway cache, then refetches.
 *
 * Railway reads are cached so that opening `/servers`, sorting it, or reloading does
 * not issue a fresh GraphQL round trip every time. This is the escape hatch for when
 * you have just changed something in the Railway dashboard and want to see it now.
 */
export function RefreshRailwayButton({ onRefreshed }: RefreshRailwayButtonProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/railway/refresh', {}),
    onSuccess: async () => {
      /** The client holds its own copy too, so both layers have to be dropped. */
      await queryClient.invalidateQueries({ queryKey: ['railway'] })
      onRefreshed?.()
      toast.success('Refreshed from Railway')
    },
    onError: () => toast.error('Could not refresh from Railway'),
  })

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      onClick={() => mutate()}
      isLoading={isPending}
      loadingText='Refreshing…'
      leftIcon={<IconRefresh className='h-4 w-4' />}>
      Refresh
    </Button>
  )
}
