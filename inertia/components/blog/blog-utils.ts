import type { RawBlogPost } from '#types/model-types'

export function getCoverImageUrl(post: RawBlogPost): string | null {
  const path = post.coverImage?.name
  const url = 'https://pub-362e8d5887644f3f8b73715561b86e9e.r2.dev/blog-images'
  return path ? `${url}/${path}` : post.coverImageAltUrl || null
}

export function getCoverImageAlt(post: RawBlogPost): string {
  return post.excerpt || post.title || 'Blog post cover image'
}

export function formatBlogDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return value
  }
}
// locale is the uk
export function formatBlogDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function getReadingMinutes(text: string): number | null {
  const trimmed = String(text || '').trim()
  if (!trimmed) return null
  const words = trimmed.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

/** Used by edit form to detect if cover is "Link" (URL) vs "Upload" */
export function getInitialIsUploadedPhotoLink(post: RawBlogPost): boolean {
  const alt = post.coverImageAltUrl
  if (alt && (alt.startsWith('http://') || alt.startsWith('https://'))) return true
  return false
}

export const COVER_PHOTO_OPTIONS = [
  { value: false, label: 'Upload photo', description: 'Upload an image file' },
  { value: true, label: 'Link', description: 'Use an image URL' },
] as const
