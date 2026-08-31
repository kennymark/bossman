import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import axios from 'axios'

import BlogPost from '#models/blog_post'
import env from '#start/env'

const STRAPI_BASE = 'https://cms.togetha.co.uk'
const strapi = axios.create({
  baseURL: 'https://cms.togetha.co.uk/api',
  headers: { Authorization: `Bearer ${env.get('STRAPI_API')}` },
})

interface StrapiInlineChild {
  type: 'link' | 'text'
  url?: string
  children?: StrapiInlineChild[]
  text?: string
  bold?: boolean
}

interface StrapiBlock {
  type: string
  url?: string
  image?: { url?: string }
  format?: string
  children?: StrapiInlineChild[] | Array<{ children?: StrapiInlineChild[] }>
}

/** Render inline children (text + bold + link) to a single string for markdown */
function renderInline(children: StrapiInlineChild[] | undefined): string {
  if (!children?.length) return ''
  const parts: string[] = []
  for (const child of children) {
    if (child.type === 'link' && child.url) {
      const inner = renderInline(child.children)
      parts.push(`[${inner}](${child.url})`)
    } else if (child.type === 'text') {
      const t = child.text ?? ''
      parts.push(child.bold ? `**${t}**` : t)
    }
  }
  return parts.join('')
}
/** Convert Strapi rich text body to markdown (paragraphs, lists, images, links) */
function strapiBodyToMarkdown(body: StrapiBlock[] | null | undefined): string {
  if (!body || !Array.isArray(body)) return ''
  const lines: string[] = []
  for (const block of body) {
    const imgUrl = block.url ?? block.image?.url
    if (imgUrl) {
      const full = imgUrl.startsWith('http') ? imgUrl : `${STRAPI_BASE}${imgUrl}`
      lines.push(`![](${full})`)
      continue
    }
    if (block.type === 'list' && Array.isArray(block.children)) {
      const prefix = block.format === 'ordered' ? '1.' : '-'
      for (const item of block.children) {
        const itemChildren = 'children' in item ? item.children : undefined
        const text = renderInline(itemChildren as StrapiInlineChild[] | undefined).trim()
        if (text) lines.push(`${prefix} ${text}`)
      }
      continue
    }
    if (block.type === 'paragraph' && block.children?.length) {
      const line = renderInline(block.children as StrapiInlineChild[]).trim()
      if (line) lines.push(line)
      else lines.push('')
    } else {
      lines.push('')
    }
  }
  // Join with \n\n except consecutive list lines (so they form one list)
  const listLineRegex = /^(\d+\.|-)\s/
  let out = ''
  for (let i = 0; i < lines.length; i++) {
    const curr = lines[i]
    const prev = i > 0 ? lines[i - 1] : ''
    const currIsList = listLineRegex.test(curr)
    const prevIsList = listLineRegex.test(prev)
    if (i > 0) {
      out += currIsList && prevIsList ? '\n' : '\n\n'
    }
    out += curr
  }
  return out
}

export default class MigrateBlogs extends BaseCommand {
  static commandName = 'migrate:blogs'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const response = await strapi.get(
      '/blog-posts?pagination[pageSize]=100&sort=publishedAt:desc&publicationState=preview&filters[publishedAt][$null]=true',
    )
    const blogPosts = response.data.data
    this.logger.info(`Found ${blogPosts.length} blog posts`)

    for (const blogPost of blogPosts) {
      const actualPost = blogPost.attributes
      this.logger.info(`About to migrate blog post  ${actualPost.slug}`)
      try {
        const post = await BlogPost.firstOrCreate(
          { slug: actualPost.slug },
          {
            title: actualPost.title,
            body: strapiBodyToMarkdown(actualPost.body),
            slug: actualPost.slug,
            excerpt: actualPost.description || actualPost.summary,
            publishedAt: actualPost.publishedAt,
            coverImageAltUrl: actualPost.cover_image_alt_url,
            createdAt: actualPost.createdAt,
            updatedAt: actualPost.updatedAt,
          },
          { connection: 'prod' },
        )

        this.logger.success(`Migrated blog post ${post.title}`)
      } catch (err) {
        console.error(err)
        this.logger.info(`Error migrating blog post ${actualPost.title ?? actualPost.slug}`)
      }
    }

    process.exit(0)
  }
}
