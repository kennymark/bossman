import path from 'node:path'
import { getDirname } from '@adonisjs/core/helpers'
import inertia from '@adonisjs/inertia/client'
import adonisjs from '@adonisjs/vite/client'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    inertia({ ssr: { enabled: false } }),
    tailwindcss(),
    adonisjs({
      entrypoints: ['resources/css/app.css', 'inertia/app/app.tsx'],
      reload: ['resources/views/**/*.edge'],
    }),
  ],
  server: {
    allowedHosts: ['starter-template-96pc.onrender.com'],
  },
  resolve: {
    alias: {
      '~/': `${getDirname(import.meta.url)}/`,
      '@': path.resolve(__dirname, './inertia'),
    },
  },
})
