import { Link } from '@inertiajs/react'

import type { RawBlogPost } from '#types/model-types'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { BlogMetaDateReadTime } from './blog-meta-date-read-time'
import { getCoverImageAlt, getCoverImageUrl } from './blog-utils'

export interface BlogPostCardProps {
  post: RawBlogPost
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const coverUrl = getCoverImageUrl(post)

  return (
    <Link href={`/blog/${post.slug}`} className='group block'>
      <Card className='overflow-hidden h-full flex flex-col'>
        <div className='relative bg-muted'>
          <div className='aspect-[16/9]'>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={getCoverImageAlt(post)}
                className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]'
                loading='lazy'
              />
            ) : (
              <div className='h-full w-full' />
            )}
          </div>
          <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-80' />
        </div>

        <CardHeader className='space-y-2'>
          <CardTitle className='text-xl leading-snug group-hover:underline line-clamp-2'>
            {post.title}
          </CardTitle>
          {post.excerpt ? (
            <p className='text-sm text-muted-foreground line-clamp-3'>{post.excerpt}</p>
          ) : null}
        </CardHeader>

        <CardFooter className='mt-auto'>
          <BlogMetaDateReadTime post={post} className='text-muted-foreground' />
        </CardFooter>
      </Card>
    </Link>
  )
}
