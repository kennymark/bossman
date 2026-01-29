'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'

interface InputOtpProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  inputClassName?: string
  /** Defaults to digits only */
  allowAlphanumeric?: boolean
}

export function InputOtp({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  autoFocus = false,
  inputClassName,
  allowAlphanumeric = false,
  className,
  ...props
}: InputOtpProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([])

  const normalizedValue = String(value || '').slice(0, Math.max(1, length))
  const chars = React.useMemo(() => {
    const safeLength = Math.max(1, length)
    return Array.from({ length: safeLength }, (_, i) => normalizedValue[i] ?? '')
  }, [normalizedValue, length])

  const inputKeys = React.useMemo(() => {
    const safeLength = Math.max(1, length)
    return Array.from({ length: safeLength }, (_, i) => `otp_${i}`)
  }, [length])

  const sanitize = React.useCallback(
    (raw: string) => {
      const cleaned = String(raw || '').replace(/\s+/g, '')
      if (!cleaned) return ''
      return allowAlphanumeric ? cleaned.replace(/[^a-zA-Z0-9]/g, '') : cleaned.replace(/\D/g, '')
    },
    [allowAlphanumeric],
  )

  const focusIndex = (index: number) => {
    inputsRef.current[index]?.focus()
    inputsRef.current[index]?.select()
  }

  const emit = React.useCallback(
    (nextChars: string[]) => {
      let end = nextChars.length
      while (end > 0 && nextChars[end - 1] === '') end--
      const nextValue = nextChars.slice(0, end).join('')
      onChange(nextValue)
      if (onComplete && nextChars.every((c) => c !== '')) onComplete(nextChars.join(''))
    },
    [onChange, onComplete],
  )

  const setCharAt = (index: number, nextChar: string) => {
    const next = [...chars]
    if (!nextChar) {
      // Keep the value contiguous: clearing clears the rest too
      for (let i = index; i < next.length; i++) next[i] = ''
      emit(next)
      return
    }

    next[index] = nextChar
    emit(next)
  }

  const pasteAt = (index: number, pasted: string) => {
    const next = [...chars]
    const safe = sanitize(pasted)
    if (!safe) return

    let cursor = index
    for (const c of safe) {
      if (cursor >= next.length) break
      next[cursor] = c
      cursor++
    }

    emit(next)

    const firstEmpty = next.findIndex((c) => c === '')
    if (firstEmpty === -1) return
    focusIndex(firstEmpty)
  }

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role='group'
      aria-label='One time password'
      {...props}
    >
      {inputKeys.map((key, index) => (
        <Input
          key={key}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          value={chars[index] ?? ''}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          inputMode={allowAlphanumeric ? 'text' : 'numeric'}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern={allowAlphanumeric ? '[a-zA-Z0-9]*' : '[0-9]*'}
          type='text'
          className={cn(
            'w-10 text-center font-mono tracking-widest',
            inputClassName,
          )}
          maxLength={1}
          aria-label={`Digit ${index + 1} of ${length}`}
          onFocus={() => focusIndex(index)}
          onPaste={(e) => {
            e.preventDefault()
            const text = e.clipboardData.getData('text')
            pasteAt(index, text)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              if (index > 0) focusIndex(index - 1)
              return
            }

            if (e.key === 'ArrowRight') {
              e.preventDefault()
              if (index < chars.length - 1) focusIndex(index + 1)
              return
            }

            if (e.key === 'Backspace') {
              e.preventDefault()
              if (chars[index]) {
                setCharAt(index, '')
                return
              }
              if (index > 0) {
                focusIndex(index - 1)
                setCharAt(index - 1, '')
              }
            }
          }}
          onChange={(e) => {
            const raw = e.target.value
            const next = sanitize(raw)
            if (!next) {
              setCharAt(index, '')
              return
            }

            if (next.length > 1) {
              pasteAt(index, next)
              return
            }

            setCharAt(index, next)
            if (index < chars.length - 1) focusIndex(index + 1)
          }}
        />
      ))}
    </div>
  )
}

