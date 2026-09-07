'use client'

import * as React from 'react'

export type PageCommand = {
  /** Stable id within a source (e.g. `ban-user`). */
  id: string
  label: string
  description?: string
  keywords?: string
  icon?: React.ReactNode
  onSelect: () => void
}

type CommandMeta = Omit<PageCommand, 'onSelect'>

type PageCommandsContextValue = {
  commands: PageCommand[]
  register: (sourceId: string, commands: PageCommand[]) => void
}

const PageCommandsContext = React.createContext<PageCommandsContextValue | null>(null)

function metaKey(commands: CommandMeta[]) {
  return commands.map((c) => `${c.id}\0${c.label}\0${c.description ?? ''}\0${c.keywords ?? ''}`).join('\n')
}

/**
 * Holds contextual Cmd+K actions registered by the active page (Quick Actions,
 * header buttons, etc.). Lives in the dashboard shell so the palette can read them.
 */
export function PageCommandsProvider({ children }: { children: React.ReactNode }) {
  const [metaBySource, setMetaBySource] = React.useState<Record<string, CommandMeta[]>>({})
  const handlersRef = React.useRef<Record<string, Record<string, () => void>>>({})

  const register = React.useCallback((sourceId: string, commands: PageCommand[]) => {
    const handlers: Record<string, () => void> = {}
    const meta: CommandMeta[] = commands.map(({ onSelect, ...rest }) => {
      handlers[rest.id] = onSelect
      return rest
    })
    handlersRef.current[sourceId] = handlers

    setMetaBySource((prev) => {
      const prevMeta = prev[sourceId]
      if (commands.length === 0) {
        if (!(sourceId in prev)) return prev
        const { [sourceId]: _, ...rest } = prev
        return rest
      }
      if (prevMeta && metaKey(prevMeta) === metaKey(meta)) {
        return prev
      }
      return { ...prev, [sourceId]: meta }
    })
  }, [])

  const commands = React.useMemo<PageCommand[]>(() => {
    return Object.entries(metaBySource).flatMap(([sourceId, list]) =>
      list.map((meta) => ({
        ...meta,
        onSelect: () => {
          handlersRef.current[sourceId]?.[meta.id]?.()
        },
      })),
    )
  }, [metaBySource])

  const value = React.useMemo(() => ({ commands, register }), [commands, register])

  return <PageCommandsContext.Provider value={value}>{children}</PageCommandsContext.Provider>
}

/** Read the flat list of page commands (palette). Safe outside provider → []. */
export function usePageCommands(): PageCommand[] {
  const ctx = React.useContext(PageCommandsContext)
  return ctx?.commands ?? []
}

/**
 * Register contextual actions for the current page. Cleared on unmount.
 * Prefer a stable `sourceId` per call site. Handlers stay fresh via ref; only
 * label/id changes re-render the palette list.
 */
export function useRegisterPageCommands(commands: PageCommand[], sourceId: string) {
  const ctx = React.useContext(PageCommandsContext)
  const register = ctx?.register
  const commandsRef = React.useRef(commands)
  commandsRef.current = commands

  React.useEffect(() => {
    if (!register) return
    register(sourceId, commandsRef.current)
  })

  React.useEffect(() => {
    if (!register) return
    return () => register(sourceId, [])
  }, [register, sourceId])
}
