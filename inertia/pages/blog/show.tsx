import { Head, Link, usePage } from '@inertiajs/react'
import { IconArrowLeft, IconPencil } from '@tabler/icons-react'

import type { RawBlogPost } from '#types/model-types'
import {
  BlogBodyRenderer,
  BlogMetaLine,
  getCoverImageAlt,
  getCoverImageUrl,
} from '@/components/blog'
import { PublicLayout } from '@/components/layouts/public'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface BlogShowProps {
  post: RawBlogPost
}

export default function BlogShow({ post }: BlogShowProps) {
  const coverUrl = getCoverImageUrl(post)
  /** This page is public, so the management link is only for admins who can use it. */
  const canManage = Boolean(usePage().props.user?.isAdminOrSuperAdmin)

  return (
    <PublicLayout>
      <Head title={post.title} />
      <div className='relative'>
        <div className='pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/10 to-transparent' />

        <div className='max-w-screen-xl mx-auto px-6 py-10 space-y-8'>
          <div>
            <div className='flex flex-wrap items-center gap-2'>
              <Button variant='ghost' asChild leftIcon={<IconArrowLeft className='h-4 w-4' />}>
                <Link href='/blog'>Back to blog</Link>
              </Button>
              {canManage && (
                <Button
                  variant='outline'
                  size='sm'
                  asChild
                  leftIcon={<IconPencil className='h-4 w-4' />}>
                  <Link href={`/blog/manage/${post.id}/edit`}>Edit</Link>
                </Button>
              )}
            </div>
          </div>

          <div className='grid gap-8'>
            <article className='space-y-6 max-w-3xl'>
              {coverUrl ? (
                <Card className='overflow-hidden'>
                  <div className='aspect-[16/9] bg-muted'>
                    <img
                      src={coverUrl}
                      alt={getCoverImageAlt(post)}
                      className='h-full w-full object-cover'
                      loading='eager'
                    />
                  </div>
                </Card>
              ) : null}

              <div className='space-y-3'>
                <BlogMetaLine post={post} showStatus />

                <h1 className='text-4xl sm:text-5xl font-bold tracking-tight'>{post.title}</h1>
                {post.excerpt ? (
                  <p className='text-muted-foreground text-base sm:text-lg max-w-3xl'>
                    {post.excerpt}
                  </p>
                ) : null}
              </div>

              <BlogBodyRenderer body={post.body} />
            </article>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
