import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import BlogAuthor from '#models/blog_author'
import BlogCategory from '#models/blog_category'
import BlogPost from '#models/blog_post'
import BlogTag from '#models/blog_tag'
import { createBlogPostValidator, updateBlogPostValidator } from '#validators/blog'

export default class BlogPostsController {
  async index({ request, inertia }: HttpContext) {
    const queryParams = await request.paginationQs()

    const query = BlogPost.query()
      .whereNotNull('published_at')
      .preload('category')
      .preload('tags')
      .preload('authors')
      .orderBy('published_at', 'desc')
      .if(queryParams.search, (q) => {
        q.where('title', 'like', `%${queryParams.search}%`)
      })

    const posts = await query.paginate(queryParams.page || 1, queryParams.perPage || 12)

    return inertia.render('blog/index', { posts })
  }

  async show({ params, inertia, response }: HttpContext) {
    const post = await BlogPost.query()
      .where('slug', params.slug)
      .whereNotNull('published_at')
      .preload('category')
      .preload('tags')
      .preload('authors')
      .first()

    if (!post) return response.notFound({ error: 'Post not found' })

    return inertia.render('blog/show', { post })
  }

  async adminIndex({ request, inertia }: HttpContext) {
    const queryParams = await request.paginationQs()

    let query = BlogPost.query()
      .preload('category')
      .preload('tags')
      .preload('authors')
      .orderBy('created_at', 'desc')

    if (queryParams.search) {
      const searchTerm = `%${queryParams.search}%`
      query = query.where((q) => {
        q.where('title', 'like', searchTerm).orWhere('summary', 'like', searchTerm)
      })
    }

    const posts = await query.paginate(queryParams.page || 1, queryParams.perPage || 10)

    return inertia.render('blog/admin/index', { posts })
  }

  async create({ inertia }: HttpContext) {
    const categories = await BlogCategory.query().orderBy('name', 'asc')
    const tags = await BlogTag.query().orderBy('name', 'asc')
    const authors = await BlogAuthor.query().orderBy('name', 'asc')

    return inertia.render('blog/admin/create', {
      categories,
      tags,
      authors,
    })
  }

  async edit({ params, inertia, response }: HttpContext) {
    const post = await BlogPost.query()
      .where('id', params.id)
      .preload('category')
      .preload('tags')
      .preload('authors')
      .first()

    if (!post) return response.notFound({ error: 'Post not found' })

    const categories = await BlogCategory.query().orderBy('name', 'asc')
    const tags = await BlogTag.query().orderBy('name', 'asc')
    const authors = await BlogAuthor.query().orderBy('name', 'asc')

    return inertia.render('blog/admin/edit', {
      post,
      categories,
      tags,
      authors,
    })
  }

  async store({ request, response }: HttpContext) {
    const { tagIds, authorIds, publish, ...body } =
      await request.validateUsing(createBlogPostValidator)

    const trx = await db.transaction()
    try {
      const post = await BlogPost.create(body, { client: trx })

      if (publish) post.publishedAt = DateTime.now()
      await post.save()

      await post.related('authors').sync(authorIds)
      await post.related('tags').sync(tagIds ?? [])

      await trx.commit()
      return response.redirect('/blog/manage')
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async update({ params, request, response }: HttpContext) {
    const { tagIds, authorIds, publish, ...body } =
      await request.validateUsing(updateBlogPostValidator)
    const trx = await db.transaction()
    const post = await BlogPost.findOrFail(params.id, { client: trx })

    try {
      post.merge(body)

      post.publishedAt = publish ? (post.publishedAt ?? DateTime.now()) : null

      await post.save()

      if (authorIds) await post.related('authors').sync(authorIds)
      if (tagIds) await post.related('tags').sync(tagIds)

      await trx.commit()
      return response.redirect('/blog/manage')
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async destroy({ params, response }: HttpContext) {
    const post = await BlogPost.findOrFail(params.id)
    await post.delete()
    return response.redirect('/blog/manage')
  }
}
