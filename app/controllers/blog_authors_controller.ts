import type { HttpContext } from '@adonisjs/core/http'
import BlogAuthor from '#models/blog_author'
import { createBlogAuthorValidator } from '#validators/blog'

export default class BlogAuthorsController {
  async index({ inertia }: HttpContext) {
    const authors = await BlogAuthor.query().orderBy('name', 'asc')
    return inertia.render('blog/admin/authors', { authors })
  }

  async store({ request, response }: HttpContext) {
    const body = await request.validateUsing(createBlogAuthorValidator)
    await BlogAuthor.create({
      name: body.name,
      email: body.email ?? null,
      avatarUrl: body.avatarUrl?.trim() ? body.avatarUrl.trim() : null,
      bio: body.bio ?? null,
    })
    return response.redirect('/blog/manage/authors')
  }

  async destroy({ params, response }: HttpContext) {
    const author = await BlogAuthor.findOrFail(params.id)
    await author.delete()
    return response.redirect('/blog/manage/authors')
  }
}
