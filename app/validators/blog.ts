import vine from '@vinejs/vine'

export const createBlogPostValidator = vine.create(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(255),
    body: vine.string().trim(),
    excerpt: vine.string().trim().maxLength(2000).optional(),
    isUploadedPhotoLink: vine.boolean().optional(),
    coverImageAltUrl: vine.string().trim().maxLength(2048).optional(),
    publish: vine.boolean().optional(),
    publishedAt: vine.string().optional(),
  }),
)

export const updateBlogPostValidator = vine.create(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(255).optional(),
    body: vine.string().trim().optional(),
    excerpt: vine.string().trim().maxLength(2000).optional(),
    isUploadedPhotoLink: vine.boolean().optional(),
    coverImageAltUrl: vine.string().trim().maxLength(2048).optional(),
    publish: vine.boolean().optional(),
    publishedAt: vine.string().optional(),
  }),
)

export const createBlogCategoryValidator = vine.create(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    description: vine.string().trim().maxLength(2000).optional(),
  }),
)
