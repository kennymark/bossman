import type { HttpContext } from '@adonisjs/core/http'
import BlogTag from '#models/blog_tag'
import { createBlogTagValidator } from '#validators/blog'

export default class BlogTagsController {
  async index({ inertia }: HttpContext) {
    const tags = await BlogTag.query().orderBy('name', 'asc')
    return inertia.render('blog/admin/tags', { tags })
  }

  async store({ request, response }: HttpContext) {
    const body = await request.validateUsing(createBlogTagValidator)
    await BlogTag.create(body)
    return response.redirect('/blog/manage/tags')
  }

  async destroy({ params, response }: HttpContext) {
    const tag = await BlogTag.findOrFail(params.id)
    await tag.delete()
    return response.redirect('/blog/manage/tags')
  }
}
