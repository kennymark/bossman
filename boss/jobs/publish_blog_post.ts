import logger from '@adonisjs/core/services/logger'
import vine from '@vinejs/vine'

import BlogPost from '#models/blog_post'

import { worker } from '../base.js'

export const publishBlogPostJob = worker
  .createJob('publish-blog-post')
  .input(
    vine.object({
      postId: vine.number(),
      /**
       * Must match a configured Lucid connection. As a free-form string any other value
       * reached `BlogPost.query({ connection })` and threw, burning all three retries.
       */
      env: vine.enum(['dev', 'prod'] as const),
    }),
  )
  .retry({ limit: 3, delay: 60, backoff: true })
  .work(async ({ postId, env }) => {
    const post = await BlogPost.query({ connection: env }).where('id', postId).first()

    if (!post) {
      logger.warn({ postId, env }, 'Scheduled blog post no longer exists')
      return
    }

    /** Only publish while still scheduled: the post may have been published or unscheduled. */
    if (!post.scheduledAt || post.publishedAt) {
      logger.info({ postId, env }, 'Scheduled blog post skipped')
      return
    }

    post.publishedAt = post.scheduledAt
    post.scheduledAt = null
    post.scheduleJobId = null
    await post.save()

    logger.info({ postId, env }, 'Published scheduled blog post')
  })
