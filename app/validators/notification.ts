import vine from '@vinejs/vine'

/**
 * Moved out of the controller so it is importable: Tuyau types an endpoint's body
 * from the validator handed to `request.validateUsing`, and it can only do that when
 * the validator is an exported symbol it can name in a generated `import(...)` type.
 * As a module-local `const` this rule validated correctly at runtime but left the
 * endpoint typed `body: {}` for the client.
 */
export const markAsReadValidator = vine.create(
  vine.object({
    notificationId: vine.string(),
  }),
)
