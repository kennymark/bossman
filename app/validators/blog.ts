import vine from '@vinejs/vine'

export const createBlogPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(255),
    summary: vine.string().trim().maxLength(1000).optional(),
    content: vine.string().optional(),
    // Accept empty strings from form inputs; we normalize to null in controllers.
    thumbnailUrl: vine.string().trim().maxLength(2048).trim().optional(),
    coverImageUrl: vine.string().trim().maxLength(2048).trim().optional(),
    categoryId: vine.string().trim().optional(),
    tagIds: vine.array(vine.string().uuid()).optional(),
    authorIds: vine.array(vine.string().uuid()),
    publish: vine.boolean().optional(),
  }),
)

export const updateBlogPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(2).maxLength(255).optional(),
    summary: vine.string().trim().maxLength(1000).optional(),
    content: vine.string().optional(),
    // Accept empty strings from form inputs; we normalize to null in controllers.
    thumbnailUrl: vine.string().trim().maxLength(2048).optional(),
    coverImageUrl: vine.string().trim().maxLength(2048).optional(),
    categoryId: vine.string().trim().optional(),
    tagIds: vine.array(vine.string().uuid()).optional(),
    authorIds: vine.array(vine.string().uuid()).optional(),
    publish: vine.boolean().optional(),
  }),
)

export const createBlogCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    description: vine.string().trim().maxLength(2000).optional(),
  }),
)

export const createBlogTagValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
  }),
)

export const createBlogAuthorValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    email: vine.string().trim().email().toLowerCase().optional(),
    avatarUrl: vine.string().trim().maxLength(2048).optional(),
    bio: vine.string().trim().maxLength(5000).optional(),
  }),
)
