import { defineConfig, OTLPTraceExporter } from '@adonisjs/otel'

import env from '#start/env'

const axiomToken = env.get('AXIOM_TOKEN')
const axiomDataset = env.get('AXIOM_DATASET')

/**
 * Only export traces when Axiom is configured. An exporter pointed at an endpoint it
 * cannot authenticate against still buffers spans and blocks flush on shutdown, which
 * left `ace` commands and the test runner hanging long after their work was done.
 */
const traceExporter =
  axiomToken && axiomDataset
    ? new OTLPTraceExporter({
        url: 'https://us-east-1.aws.edge.axiom.co/v1/traces',
        headers: {
          Authorization: `Bearer ${axiomToken}`,
          'X-Axiom-Dataset': axiomDataset,
        },
      })
    : undefined

export default defineConfig({
  serviceName: env.get('APP_NAME'),
  serviceVersion: env.get('APP_VERSION'),
  environment: env.get('APP_ENV'),
  ...(traceExporter ? { traceExporter } : {}),
  userContext: {
    resolver: async (ctx) => {
      if (!ctx.auth.user) return null

      return {
        id: ctx.auth.user.id,
        email: ctx.auth.user.email,
        role: ctx.auth.user.role,
      }
    },
  },

  // samplingRatio: app ? 1.0 : 0.1,
})
