import { IconLoader2, IconTerminal2 } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { BaseSheet } from '@/components/ui/base-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { ScrollArea } from '@/components/ui/scroll-area'
import { dateFormatter } from '@/lib/date'
import api from '@/lib/http'

export interface RailwayLog {
  message: string
  timestamp: string
  level?: string
}

interface RuntimeLogsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deploymentId: string | null
}

export function RuntimeLogsSheet({ open, onOpenChange, deploymentId }: RuntimeLogsSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['railway', 'deployment-logs', deploymentId],
    queryFn: async () => {
      if (!deploymentId) return []
      return (await api.railway.deploymentLogs({ params: { id: deploymentId } })) ?? []
    },
    enabled: !!deploymentId && open,
    refetchInterval: open ? 3_000 : false,
  })

  // Scroll to bottom when sheet opens and logs are loaded so latest logs are visible.
  // Defer with rAF so layout is complete (fixes reopen after close).
  useEffect(() => {
    if (!open || isLoading || logs.length === 0) return
    const scrollToBottom = () => {
      const scrollable = scrollRef.current?.firstElementChild as HTMLElement | null
      if (scrollable) scrollable.scrollTop = scrollable.scrollHeight
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(scrollToBottom))
    return () => cancelAnimationFrame(id)
  }, [open, isLoading, logs])

  return (
    <BaseSheet
      open={open}
      onOpenChange={onOpenChange}
      title='Runtime logs'
      description='Most recent runtime output for this deployment.'
      side='right'
      className='w-full sm:max-w-3xl'>
      {isLoading ? (
        <div className='flex min-h-[200px] items-center justify-center py-12'>
          <IconLoader2 className='h-10 w-10 animate-spin text-primary' />
        </div>
      ) : (
        <div className='h-[85vh] min-h-0 overflow-hidden'>
          <ScrollArea ref={scrollRef} className='h-full'>
            <div className='rounded-lg border border-border bg-[#0d1117] p-4 font-mono text-[13px] shadow-inner'>
              <div className='mb-3 flex items-center gap-2 border-b border-white/10 pb-2'>
                <span className='h-2.5 w-2.5 rounded-full bg-emerald-500' />
                <span className='text-xs uppercase tracking-wider text-zinc-500'>
                  Runtime output
                </span>
              </div>
              {logs.length > 0 ? (
                <div className='space-y-0.5'>
                  {logs.map((log, i) => (
                    <div
                      key={`${log.timestamp ?? ''}-${i}`}
                      className='flex gap-3 rounded py-1.5 pl-1 hover:bg-white/5'>
                      <span className='shrink-0 select-none text-zinc-500'>
                        {log.timestamp ? dateFormatter(log.timestamp, 'basicWithTime') : '—'}
                      </span>
                      <span className='min-w-0 break-words text-zinc-300'>{log.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={IconTerminal2}
                  title='No runtime logs'
                  description='Logs will appear when the service is running.'
                  className='py-6 [&_h3]:text-zinc-400 [&_p]:text-zinc-500 [&_.bg-muted]:bg-white/5'
                />
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </BaseSheet>
  )
}
