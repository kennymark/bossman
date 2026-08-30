import { BaseTransformer } from '@adonisjs/core/transformers'

import type BlogPost from '#models/blog_post'

export default class BlogPostTransformer extends BaseTransformer<BlogPost> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'title',
      'body',
      'slug',
      'excerpt',
      'coverImage',
      'coverImageAltUrl',
      'publishedAt',
      'scheduledAt',
      'createdAt',
      'updatedAt',
    ])
  }
}
