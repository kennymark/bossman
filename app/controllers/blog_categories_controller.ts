import type { HttpContext } from '@adonisjs/core/http'
import BlogCategory from '#models/blog_category'
import { createBlogCategoryValidator } from '#validators/blog'

export default class BlogCategoriesController {
  async index({ inertia }: HttpContext) {
    const categories = await BlogCategory.query().orderBy('name', 'asc')
    return inertia.render('blog/admin/categories', { categories })
  }

  async store({ request, response }: HttpContext) {
    const body = await request.validateUsing(createBlogCategoryValidator)
    await BlogCategory.create(body)
    return response.redirect('/blog/manage/categories')
  }

  async destroy({ params, response }: HttpContext) {
    const category = await BlogCategory.findOrFail(params.id)
    await category.delete()
    return response.redirect('/blog/manage/categories')
  }
}
