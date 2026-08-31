import { Link } from '@inertiajs/react'
import { IconArrowRight } from '@tabler/icons-react'

import type { RawBlogPost } from '#types/model-types'
import { Card } from '@/components/ui/card'
import { HStack } from '@/components/ui/hstack'
import { Stack } from '@/components/ui/stack'

import { BlogMetaDateReadTime } from './blog-meta-date-read-time'
import { getCoverImageAlt, getCoverImageUrl } from './blog-utils'

export interface BlogFeaturedPostCardProps {
  post: RawBlogPost
}

export function BlogFeaturedPostCard({ post }: BlogFeaturedPostCardProps) {
  const coverUrl = getCoverImageUrl(post)

  return (
    <Link href={`/blog/${post.slug}`} className='group block'>
      <Card className='overflow-hidden'>
        <div className='grid gap-0 lg:grid-cols-[1.2fr_1fr] lg:max-h-52'>
          <div className='relative bg-muted min-h-0'>
            <div className='aspect-[16/9] lg:aspect-auto lg:h-full lg:max-h-52'>
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={getCoverImageAlt(post)}
                  className='h-full w-full object-cover'
                  loading='lazy'
                />
              ) : (
                <div className='h-full w-full' />
              )}
            </div>
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent' />
            <div className='absolute bottom-3 left-3 right-3'>
              <HStack spacing={2} wrap align='center'>
                <BlogMetaDateReadTime post={post} className='text-white/90' />
              </HStack>
            </div>
          </div>

          <div className='p-4 lg:p-5 min-h-0'>
            <Stack spacing={3} className='h-full'>
              <Stack spacing={1.5}>
                <div className='text-xs text-muted-foreground'>Featured</div>
                <div className='text-xl sm:text-2xl font-bold tracking-tight group-hover:underline'>
                  {post.title}
                </div>
                {post.excerpt ? (
                  <p className='text-muted-foreground text-sm line-clamp-2'>{post.excerpt}</p>
                ) : null}
              </Stack>

              <HStack justify='between' align='center' className='mt-auto gap-4'>
                <HStack spacing={1} align='center' className='text-sm font-medium'>
                  Read
                  <IconArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
                </HStack>
              </HStack>
            </Stack>
          </div>
        </div>
      </Card>
    </Link>
  )
}
