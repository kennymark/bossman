import { IconCalendar, IconClock } from '@tabler/icons-react'

import type { RawBlogPost } from '#types/model-types'
import { Badge } from '@/components/ui/badge'

import { formatBlogDate, getReadingMinutes } from './blog-utils'

export interface BlogStatusBadgeProps {
  post: RawBlogPost
  className?: string
}

export function BlogStatusBadge({ post, className }: BlogStatusBadgeProps) {
  const isScheduled = Boolean(post.scheduledAt)
  const isPublished = Boolean(post.publishedAt)

  return (
    <Badge
      variant={isPublished ? 'default' : isScheduled ? 'outline' : 'secondary'}
      className={className}>
      {isPublished ? 'Published' : isScheduled ? 'Scheduled' : 'Draft'}
    </Badge>
  )
}

export interface BlogMetaLineProps {
  post: RawBlogPost
  /** Include status badge (Published/Draft) */
  showStatus?: boolean
  className?: string
}

/** Inline meta: optional status badge + date + read time (for show page header) */
export function BlogMetaLine({ post, showStatus, className }: BlogMetaLineProps) {
  const dateLabel = post.publishedAt
    ? formatBlogDate(post.publishedAt)
    : post.scheduledAt
      ? formatBlogDate(post.scheduledAt)
      : null
  const minutes = getReadingMinutes(post.excerpt || '')

  return (
    <div
      className={[
        'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground',
        className,
      ]
        .filter(Boolean)
        .join(' ')}>
      {showStatus ? <BlogStatusBadge post={post} className='shrink-0' /> : null}
      {dateLabel ? (
        <span className='inline-flex items-center gap-1'>
          <IconCalendar className='h-3.5 w-3.5' />
          {dateLabel}
        </span>
      ) : null}
      {minutes !== null ? (
        <span className='inline-flex items-center gap-1'>
          <IconClock className='h-3.5 w-3.5' />
          {minutes} min read
        </span>
      ) : null}
    </div>
  )
}
