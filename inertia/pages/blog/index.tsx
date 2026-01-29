import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link } from '@inertiajs/react'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import type { PaginatedResponse } from '#types/extra'
import type { RawBlogPost } from '#types/model-types'
import { PublicLayout } from '@/components/layouts/public'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { HStack } from '@/components/ui/hstack'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { Stack } from '@/components/ui/stack'

interface BlogIndexProps extends SharedProps {
  posts: PaginatedResponse<RawBlogPost>
}

export default function BlogIndex({ posts }: BlogIndexProps) {
  const meta = posts.meta
  const featured = posts.data[0]
  const rest = posts.data.slice(1)

  return (
    <PublicLayout>
      <Head title='Blog' />
      <div className='relative'>
        <div className='pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/10 to-transparent' />
        <div className='max-w-screen-xl mx-auto px-6 py-12 space-y-10'>
          <div className='flex flex-col gap-3'>
            <Badge className='w-fit' variant='secondary'>
              Blog
            </Badge>
            <h1 className='text-4xl sm:text-5xl font-bold tracking-tight'>
              Product updates, guides, and announcements
            </h1>
            <p className='text-muted-foreground text-base sm:text-lg max-w-2xl'>
              Learn what’s new, how things work, and how to get the most out of the platform.
            </p>
          </div>

          {!posts.data.length ? (
            <Card className='p-10'>
              <div className='text-center space-y-2'>
                <div className='text-lg font-semibold'>No posts yet</div>
                <div className='text-sm text-muted-foreground'>Check back soon for updates.</div>
              </div>
            </Card>
          ) : (
            <>
              {featured ? (
                <FeaturedPostCard post={featured} />
              ) : null}

              {rest.length ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
                  {rest.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </SimpleGrid>
              ) : null}

              <HStack
                justify='between'
                align='center'
                className='flex-col sm:flex-row'>
                <div className='text-sm text-muted-foreground'>
                  Page {meta.currentPage} of {meta.lastPage} • {meta.total} posts
                </div>
                <HStack spacing={2}>
                  <Button
                    variant='outline'
                    disabled={meta.currentPage <= 1}
                    asChild={meta.currentPage > 1}>
                    <Link href='/blog' data={{ page: meta.currentPage - 1 }}>
                      Previous
                    </Link>
                  </Button>
                  <Button
                    variant='outline'
                    disabled={meta.currentPage >= meta.lastPage}
                    asChild={meta.currentPage < meta.lastPage}>
                    <Link href='/blog' data={{ page: meta.currentPage + 1 }}>
                      Next
                    </Link>
                  </Button>
                </HStack>
              </HStack>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}

function FeaturedPostCard({ post }: { post: RawBlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className='group block'>
      <Card className='overflow-hidden'>
        <div className='grid gap-0 lg:grid-cols-[1.2fr_1fr]'>
          <div className='relative bg-muted'>
            <div className='aspect-[16/9] lg:aspect-auto lg:h-full'>
              {post.thumbnailUrl ? (
                <img
                  src={post.thumbnailUrl}
                  alt={post.title}
                  className='h-full w-full object-cover'
                  loading='lazy'
                />
              ) : (
                <div className='h-full w-full' />
              )}
            </div>
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent' />
            <div className='absolute bottom-4 left-4 right-4'>
              <HStack spacing={2} wrap align='center'>
                {post.category?.name ? <Badge className='bg-background/90 text-foreground' variant='secondary'>{post.category.name}</Badge> : null}
                <MetaDateAndReadTime post={post} className='text-white/90' />
              </HStack>
            </div>
          </div>

          <div className='p-6 lg:p-8'>
            <Stack spacing={4} className='h-full'>
              <Stack spacing={2}>
                <div className='text-xs text-muted-foreground'>Featured</div>
                <div className='text-2xl sm:text-3xl font-bold tracking-tight group-hover:underline'>
                  {post.title}
                </div>
                {post.summary ? (
                  <p className='text-muted-foreground text-sm sm:text-base line-clamp-3'>{post.summary}</p>
                ) : null}
              </Stack>

              <HStack justify='between' align='center' className='mt-auto gap-4'>
                <AuthorRow post={post} />
                <HStack spacing={1} align='center' className='text-sm font-medium'>
                  Read
                  <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
                </HStack>
              </HStack>
            </Stack>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function PostCard({ post }: { post: RawBlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className='group block'>
      <Card className='overflow-hidden h-full flex flex-col'>
        <div className='relative bg-muted'>
          <div className='aspect-[16/9]'>
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt={post.title}
                className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]'
                loading='lazy'
              />
            ) : (
              <div className='h-full w-full' />
            )}
          </div>
          <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-80' />
          <div className='absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2'>
            {post.category?.name ? <Badge className='bg-background/90 text-foreground' variant='secondary'>{post.category.name}</Badge> : null}
          </div>
        </div>

        <CardHeader className='space-y-2'>
          <CardTitle className='text-xl leading-snug group-hover:underline line-clamp-2'>{post.title}</CardTitle>
          {post.summary ? <p className='text-sm text-muted-foreground line-clamp-3'>{post.summary}</p> : null}
        </CardHeader>

        <CardContent>
          <Stack spacing={3}>
            {post.tags?.length ? (
              <HStack spacing={2} wrap>
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag.id} variant='outline'>
                    {tag.name}
                  </Badge>
                ))}
                {post.tags.length > 3 ? <Badge variant='outline'>+{post.tags.length - 3}</Badge> : null}
              </HStack>
            ) : null}
          </Stack>
        </CardContent>

        <CardFooter className='mt-auto'>
          <HStack justify='between' align='center' spacing={3}>
            <AuthorRow post={post} />
            <MetaDateAndReadTime post={post} className='text-muted-foreground' />
          </HStack>
        </CardFooter>
      </Card>
    </Link>
  )
}

function AuthorRow({ post }: { post: RawBlogPost }) {
  const authors = post.authors || []
  if (!authors.length) return <span className='text-xs text-muted-foreground'>—</span>

  const first = authors[0]
  const more = authors.length - 1

  return (
    <div className='flex items-center gap-2 min-w-0'>
      <div className='flex -space-x-2'>
        {authors.slice(0, 2).map((a) => (
          <Avatar key={a.id} className='h-7 w-7 border border-border'>
            {a.avatarUrl ? <AvatarImage src={a.avatarUrl} alt={a.name || a.email || 'Author'} /> : null}
            <AvatarFallback className='text-[10px]'>{getInitials(a.name || a.email || 'A')}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className='min-w-0'>
        <div className='text-xs text-muted-foreground truncate'>
          {first?.name || first?.email || '—'}
          {more > 0 ? ` +${more}` : ''}
        </div>
      </div>
    </div>
  )
}

function MetaDateAndReadTime({ post, className }: { post: RawBlogPost; className?: string }) {
  const dateLabel = post.publishedAt ? formatDate(post.publishedAt) : null
  const minutes = getReadingMinutes(post.content || post.summary || '')

  return (
    <HStack spacing={2} align='center' className={['text-xs', className].filter(Boolean).join(' ')}>
      {dateLabel ? (
        <HStack spacing={1} align='center' className='inline-flex'>
          <Calendar className='h-3.5 w-3.5' />
          {dateLabel}
        </HStack>
      ) : null}
      {minutes ? (
        <HStack spacing={1} align='center' className='inline-flex'>
          <Clock className='h-3.5 w-3.5' />
          {minutes} min read
        </HStack>
      ) : null}
    </HStack>
  )
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return value
  }
}

function getReadingMinutes(text: string) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return null
  const words = trimmed.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 220))
  return minutes
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? 'A'
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
  return `${first}${last}`.toUpperCase()
}

