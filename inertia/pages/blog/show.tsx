
import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import type { RawBlogPost } from '#types/model-types'
import { PublicLayout } from '@/components/layouts/public'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface BlogShowProps {
  post: RawBlogPost
}

export default function BlogShow({ post }: BlogShowProps) {
  const publishedLabel = post.publishedAt ? formatDate(post.publishedAt) : null
  const minutes = getReadingMinutes(post.content || post.summary || '')
  const paragraphs = splitParagraphsWithKeys(post.content || '')
  const authorsLabel = getAuthorsLabel(post)
  const tagsLabel = getTagsLabel(post)

  return (
    <PublicLayout>
      <Head title={post.title} />
      <div className='relative'>
        <div className='pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/10 to-transparent' />

        <div className='max-w-screen-xl mx-auto px-6 py-10 space-y-8'>
          <div>
            <Button variant='ghost' asChild leftIcon={<ArrowLeft className='h-4 w-4' />}>
              <Link href='/blog'>Back to blog</Link>
            </Button>
          </div>

          <div className='grid gap-8'>
            <article className='space-y-6 max-w-3xl'>
              {post.coverImageUrl ? (
                <Card className='overflow-hidden'>
                  <div className='aspect-[16/9] bg-muted'>
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className='h-full w-full object-cover'
                      loading='eager'
                    />
                  </div>
                </Card>
              ) : null}

              <div className='space-y-3'>
                <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
                  {post.category?.name ? <Badge variant='secondary'>{post.category.name}</Badge> : null}
                  {authorsLabel ? (
                    <span className='inline-flex items-center gap-1'>
                      <span className='text-muted-foreground'>By</span>
                      <span className='text-foreground/80'>{authorsLabel}</span>
                    </span>
                  ) : null}
                  {publishedLabel ? (
                    <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                      <Calendar className='h-3.5 w-3.5' />
                      {publishedLabel}
                    </span>
                  ) : null}
                  {minutes ? (
                    <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                      <Clock className='h-3.5 w-3.5' />
                      {minutes} min read
                    </span>
                  ) : null}
                </div>

                <h1 className='text-4xl sm:text-5xl font-bold tracking-tight'>{post.title}</h1>
                {post.summary ? <p className='text-muted-foreground text-base sm:text-lg max-w-3xl'>{post.summary}</p> : null}
              </div>


              <div >
                {post.content ? (
                  <div className='space-y-5 text-base leading-7'>
                    {paragraphs.map((p) => (
                      <p key={p.key} className='text-foreground/90'>
                        {p.text}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className='text-sm text-muted-foreground'>No content.</div>
                )}
              </div>

              {tagsLabel ? (
                <div className='text-sm text-muted-foreground'>
                  <span className='font-medium text-foreground/80'>Tags:</span> {tagsLabel}
                </div>
              ) : null}
            </article>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

function splitParagraphs(text: string) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return []
  return trimmed
    .split(/\n{2,}/g)
    .map((p) => p.replace(/\n/g, '\n').trim())
    .filter(Boolean)
}

function splitParagraphsWithKeys(text: string) {
  const paragraphs = splitParagraphs(text)
  const seen = new Map<string, number>()

  return paragraphs.map((p) => {
    const base = hashString(p)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)

    return {
      key: count ? `${base}-${count}` : base,
      text: p,
    }
  })
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

function getAuthorsLabel(post: RawBlogPost) {
  const authors = post.authors || []
  if (!authors.length) return null
  return authors
    .map((a) => a.name || a.email)
    .filter(Boolean)
    .join(', ')
}

function getTagsLabel(post: RawBlogPost) {
  const tags = post.tags || []
  if (!tags.length) return null
  return tags
    .map((t) => t.name)
    .filter(Boolean)
    .join(', ')
}

function hashString(value: string) {
  // Small stable hash for React keys (non-crypto)
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return `p_${Math.abs(hash)}`
}

