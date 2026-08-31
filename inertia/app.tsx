/// <reference path="../adonisrc.ts" />
/// <reference path="../config/inertia.ts" />

import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp } from '@inertiajs/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'

import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui/sonner'

import { queryClient } from './app/query'

const appName = import.meta.env.VITE_APP_NAME || 'togetha admin'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: async (name) => {
    return resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    /**
     * `createRoot`, not `hydrateRoot`: `config/inertia.ts` has `ssr.enabled: false`, so
     * there is no server-rendered markup to hydrate. React recovered by discarding the
     * tree and client-rendering anyway, but logged a hydration mismatch every load.
     */
    createRoot(el).render(
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App {...props} />
          <Toaster position='top-right' closeButton />
        </QueryClientProvider>
      </ErrorBoundary>,
    )
  },
})
