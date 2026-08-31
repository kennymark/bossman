import * as React from 'react'

import { cn } from '@/lib/utils'

export interface BlogBodyRendererProps {
  /** Markdown string */
  body: string
  className?: string
}

/**
 * Renders bold only (used inside processInline for non-link segments)
 */
function processBold(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  for (let match = regex.exec(text); match !== null; match = regex.exec(text)) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <strong key={match.index} className='font-semibold text-foreground'>
        {match[1]}
      </strong>,
    )
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts.length === 1 ? parts[0] : parts
}

/**
 * Renders inline content: bold and [text](url) links
 */
function processInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g
  let lastIndex = 0
  for (let match = linkRegex.exec(text); match !== null; match = linkRegex.exec(text)) {
    if (match.index > lastIndex) {
      parts.push(processBold(text.slice(lastIndex, match.index)))
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target='_blank'
        rel='noopener noreferrer'
        className='text-primary underline underline-offset-2 hover:no-underline'>
        {processBold(match[1])}
      </a>,
    )
    lastIndex = linkRegex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(processBold(text.slice(lastIndex)))
  }
  return parts.length === 1 ? parts[0] : parts
}

export function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listType: 'ul' | 'ol' = 'ul'

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType
      elements.push(
        <ListTag
          key={`list-${elements.length}`}
          className={`my-4 flex flex-col gap-2 pl-6 ${listType === 'ul' ? 'list-disc' : 'list-decimal'}`}>
          {listItems}
        </ListTag>,
      )
      listItems = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={i} className='mt-12 mb-6 font-mono text-3xl font-bold tracking-tight'>
          {line.replace('# ', '')}
        </h1>,
      )
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={i} className='mt-10 mb-4 font-mono text-2xl font-bold tracking-tight'>
          {line.replace('## ', '')}
        </h2>,
      )
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={i} className='mt-8 mb-3 font-mono text-xl font-bold tracking-tight'>
          {line.replace('### ', '')}
        </h3>,
      )
    } else if (line.startsWith('#### ')) {
      flushList()
      elements.push(
        <h4 key={i} className='mt-6 mb-2 font-mono text-lg font-bold tracking-tight'>
          {line.replace('#### ', '')}
        </h4>,
      )
    } else if (line.startsWith('- ')) {
      listType = 'ul'
      listItems.push(
        <li key={i} className='leading-relaxed text-muted-foreground'>
          {processInline(line.replace('- ', ''))}
        </li>,
      )
    } else if (/^\d+\.\s/.test(line)) {
      listType = 'ol'
      listItems.push(
        <li key={i} className='leading-relaxed text-muted-foreground'>
          {processInline(line.replace(/^\d+\.\s/, ''))}
        </li>,
      )
    } else if (line.trim() === '') {
      flushList()
    } else if (/^!\[.*\]\(.+\)$/.test(line.trim())) {
      // Markdown image: ![alt](url)
      flushList()
      const match = line.trim().match(/^!\[(.*)\]\((.+)\)$/)
      if (match) {
        const [, alt, src] = match
        const altStr = alt ?? ''
        elements.push(
          <figure key={i} className='my-6'>
            <div className='relative aspect-video w-full overflow-hidden rounded-xl border border-border'>
              <img src={src} alt={altStr} className='h-full w-full object-cover' />
            </div>
            {altStr && (
              <figcaption className='mt-2 text-center text-sm text-muted-foreground'>
                {altStr}
              </figcaption>
            )}
          </figure>,
        )
      } else {
        elements.push(
          <p key={i} className='my-4 leading-relaxed text-muted-foreground'>
            {processInline(line)}
          </p>,
        )
      }
    } else {
      flushList()
      elements.push(
        <p key={i} className='my-4 leading-relaxed text-muted-foreground'>
          {processInline(line)}
        </p>,
      )
    }
  }
  flushList()

  return elements
}

/**
 * Renders blog post body (markdown) using the custom renderMarkdown function.
 */
export function BlogBodyRenderer({ body, className }: BlogBodyRendererProps) {
  const content = typeof body === 'string' ? body : ''

  if (!content.trim()) {
    return <div className={cn('text-sm text-muted-foreground', className)}>No content.</div>
  }

  return (
    <div className={cn('max-w-none text-base leading-7 text-foreground/90', className)}>
      {renderMarkdown(content)}
    </div>
  )
}
