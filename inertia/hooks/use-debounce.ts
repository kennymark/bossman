import * as React from 'react'

/** Returns `value` after it has stayed unchanged for `delayMs`. */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
