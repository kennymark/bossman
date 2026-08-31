import { IconCalendar, IconClock } from '@tabler/icons-react'

import type { RawBlogPost } from '#types/model-types'
import { HStack } from '@/components/ui/hstack'

import { formatBlogDate, getReadingMinutes } from './blog-utils'

export interface BlogMetaDateReadTimeProps {
  post: RawBlogPost
  className?: string
}

export function BlogMetaDateReadTime({ post, className }: BlogMetaDateReadTimeProps) {
  const dateLabel = post.publishedAt
    ? formatBlogDate(post.publishedAt)
    : post.scheduledAt
      ? formatBlogDate(post.scheduledAt)
      : null
  const minutes = getReadingMinutes(post.excerpt || '')

  return (
    <HStack spacing={2} align='center' className={['text-xs', className].filter(Boolean).join(' ')}>
      {dateLabel ? (
        <HStack spacing={1} align='center' className='inline-flex'>
          <IconCalendar className='h-3.5 w-3.5' />
          {dateLabel}
        </HStack>
      ) : null}
      {minutes !== null ? (
        <HStack spacing={1} align='center' className='inline-flex'>
          <IconClock className='h-3.5 w-3.5' />
          {minutes} min read
        </HStack>
      ) : null}
    </HStack>
  )
}
