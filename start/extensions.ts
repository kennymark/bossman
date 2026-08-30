/**
 * Registers the framework extensions (model helpers, mail helpers, and the
 * `HttpRequest` / `HttpContext` macros).
 *
 * Preloaded rather than imported from `bin/server.ts` so every environment gets them.
 * When only the web entrypoint loaded these, `request.appEnv()`, `request.paginationQs()`
 * and `ctx.now` were undefined inside ace commands and the test runner — which surfaced
 * as `paginationQs is not a function` and as logins writing a null `last_activity`.
 */
import '#extensions/model'
import '#extensions/email'
import '#extensions/http_request'
import '#extensions/http_context'
