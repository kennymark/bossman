import { useCallback, useState } from 'react'

export interface UseDisclosureReturn {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  onOpenChange: (next: boolean) => void
  open: () => void
  close: () => void
  toggle: () => void
}

export function useDisclosure(defaultOpen = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const onOpenChange = useCallback((next: boolean) => setIsOpen(next), [])

  return { isOpen, setIsOpen, onOpenChange, open, close, toggle }
}

export default useDisclosure
