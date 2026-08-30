import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { attachmentManager } from '@jrmc/adonis-attachment'
import { DateTime } from 'luxon'

import { publishBlogPostJob } from '#boss/jobs/publish_blog_post'
import BlogPost from '#models/blog_post'
import BlogPostTransformer from '#transformers/blog_post_transformer'
import { createBlogPostValidator, updateBlogPostValidator } from '#validators/blog'

import { allowedImageExtensions } from '../data/file.js'

export default class BlogPostsController {
  async index({ request, inertia }: HttpContext) {
    const params = await request.paginationQs()
    const env = request.appEnv()
    const posts = await BlogPost.query({ connection: env })
      .whereNotNull('publishedAt')
      .orderBy('publishedAt', 'desc')
      .if(params.search, (q) => q.whereILike('title', `%${params.search}%`))
      .sortBy(params.sortBy || 'publishedAt', params.sortOrder || 'desc')
      .paginate(params.page || 1, params.perPage || 12)

    return inertia.render('blog/index', {
      query: { search: params.search ?? '', page: params.page ?? 1, perPage: params.perPage ?? 12 },
      posts: inertia.defer(async () => {
        const p = await posts
        return BlogPostTransformer.paginate(p.all(), p.getMeta()) as never
      }) as never,
    })
  }

  async show({ params, inertia, response, request }: HttpContext) {
    const env = request.appEnv()
    const post = await BlogPost.query({ connection: env })
      .where('slug', params.slug)
      .whereNotNull('publishedAt')
      .first()

    if (!post) return response.notFound({ error: 'Post not found' })

    return inertia.render('blog/show', { post: BlogPostTransformer.transform(post) as never })
  }

  async adminIndex({ request, inertia }: HttpContext) {
    const params = await request.paginationQs()
    const env = request.appEnv()
    const status = params.status ?? 'all'
    const posts = await BlogPost.query({ connection: env })
      .if(status === 'published', (q) => q.whereNotNull('publishedAt'))
      .if(status === 'scheduled', (q) => q.whereNotNull('scheduledAt'))
      .if(status === 'draft', (q) => q.whereNull('publishedAt').whereNull('scheduledAt'))
      .orderByRaw('COALESCE(published_at, scheduled_at) DESC NULLS LAST')
      .orderBy('createdAt', 'desc')
      .if(params.search, (q) => {
        const term = `%${params.search}%`
        q.whereILike('title', term).orWhereILike('excerpt', term)
      })
      .sortBy(params.sortBy || 'publishedAt', params.sortOrder || 'desc')
      .paginate(params.page || 1, params.perPage || 10)

    return inertia.render('blog/manage/index', {
      posts: inertia.defer(async () => {
        const p = await posts
        return BlogPostTransformer.paginate(p.all(), p.getMeta()) as never
      }),
    })
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('blog/manage/create', {} as never)
  }

  async edit({ params, inertia, response, request }: HttpContext) {
    const env = request.appEnv()
    const post = await BlogPost.query({ connection: env }).where('id', params.id).first()

    if (!post) return response.notFound({ error: 'Post not found' })

    return inertia.render('blog/manage/edit', {
      post: BlogPostTransformer.transform(post) as never,
    })
  }

  async store({ request, response, logger }: HttpContext) {
    const { publish, publishedAt, isUploadedPhotoLink, coverImageAltUrl, ...body } =
      await request.validateUsing(createBlogPostValidator)
    const coverFile = request.file('coverImage', {
      size: '5mb',
      extnames: allowedImageExtensions,
    })

    logger.info('🚀 ~ BlogPostsController ~ store ~ coverFile:', coverFile)
    const env = request.appEnv()

    try {
      const isScheduled = publish && publishedAt && DateTime.fromISO(publishedAt) > DateTime.now()

      const post = await BlogPost.create(
        {
          ...body,
          publishedAt:
            publish && !isScheduled
              ? publishedAt
                ? DateTime.fromISO(publishedAt)
                : DateTime.now()
              : null,
          scheduledAt: isScheduled ? DateTime.fromISO(publishedAt) : null,
        },
        { connection: env },
      )

      post.coverImage =
        coverFile && !isUploadedPhotoLink
          ? ((await attachmentManager.createFromFile(coverFile)) as BlogPost['coverImage'])
          : null
      post.coverImageAltUrl = coverImageAltUrl ?? null

      if (isScheduled && post.scheduledAt) {
        const jobId = await publishBlogPostJob.schedule({ postId: post.id, env }, post.scheduledAt)
        post.scheduleJobId = jobId
      }

      await post.save()
      // if (isUploadedPhotoLink && coverImageAltUrl) {
      //   post.coverImageAltUrl = coverImageAltUrl
      // } else if (coverFile?.isValid) {
      //   post.coverImage = (await attachmentManager.createFromFile(
      //     coverFile,
      //   )) as BlogPost['coverImage']
      // }

      return response.redirect('/blog/manage')
    } catch (error) {
      logger.error({ err: error }, 'Blog post operation failed')
      return response.badRequest({ error: 'Failed to update post' })
    }
  }

  async update({ params, request, response }: HttpContext) {
    const { publish, publishedAt, isUploadedPhotoLink, coverImageAltUrl, ...body } =
      await request.validateUsing(updateBlogPostValidator)
    const trx = await db.transaction()
    const env = request.appEnv()
    const post = await BlogPost.query({ connection: env }).where('id', params.id).first()
    if (!post) return response.notFound({ error: 'Post not found' })
    const coverFile = request.file('coverImage', {
      size: '5mb',
      extnames: allowedImageExtensions,
    })

    try {
      const isScheduled = publish && publishedAt && DateTime.fromISO(publishedAt) > DateTime.now()

      post.merge(body)

      if (isUploadedPhotoLink !== undefined) {
        if (isUploadedPhotoLink && coverImageAltUrl) {
          post.coverImageAltUrl = coverImageAltUrl
          post.coverImage = null
        } else {
          if (coverFile?.isValid) {
            post.coverImage = (await attachmentManager.createFromFile(
              coverFile,
            )) as BlogPost['coverImage']
          }
          if (coverImageAltUrl !== undefined) post.coverImageAltUrl = coverImageAltUrl ?? null
        }
      } else if (coverImageAltUrl !== undefined) {
        post.coverImageAltUrl = coverImageAltUrl ?? null
      }

      if (post.scheduleJobId && post.scheduleJobId.length > 0) {
        await publishBlogPostJob.cancel(post.scheduleJobId)
        post.scheduleJobId = null
      }

      post.publishedAt =
        publish && !isScheduled
          ? publishedAt
            ? DateTime.fromISO(publishedAt)
            : (post.publishedAt ?? DateTime.now())
          : null
      post.scheduledAt = isScheduled ? DateTime.fromISO(publishedAt) : null

      if (isScheduled && post.scheduledAt) {
        const jobId = await publishBlogPostJob.schedule({ postId: post.id, env }, post.scheduledAt)
        post.scheduleJobId = jobId
      }

      await post.save()

      await trx.commit()
      return response.redirect('/blog/manage')
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async destroy({ params, response, request }: HttpContext) {
    const env = request.appEnv()
    const post = await BlogPost.query({ connection: env }).where('id', params.id).first()
    if (!post) return response.notFound({ error: 'Post not found' })
    await post.delete()
    return response.redirect('/blog/manage')
  }
}
