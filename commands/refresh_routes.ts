// @ts-nocheck

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { hrtime } from 'node:process'
import { BaseCommand } from '@adonisjs/core/ace'
import string from '@adonisjs/core/helpers/string'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class RefreshRoutes extends BaseCommand {
  static commandName = 'refresh:routes'
  static description = 'Generate a routes.ts file for the application'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: appRouter } = await import('@adonisjs/core/services/router')
    const routeStore: RouteStore = {
      getRoutes: [],
      postRoutes: [],
      putRoutes: [],
      deleteRoutes: [],
    }
    const startTime = hrtime()

    appRouter.routes.forEach((route) => {
      const extractedRoutes = extractApiPatterns(JSON.stringify(route, null, 2))
      routeStore.getRoutes.push(...extractedRoutes.getRoutes)
      routeStore.postRoutes.push(...extractedRoutes.postRoutes)
      routeStore.putRoutes.push(...extractedRoutes.putRoutes)
      routeStore.deleteRoutes.push(...extractedRoutes.deleteRoutes)
    })

    const endTime = hrtime(startTime)

    this.logger.info(`Extraction done in ${string.prettyHrTime(endTime)}`)

    generateRoutesFile(routeStore)
    countRoutesAndPrint(routeStore, this.logger)
    process.exit(0)
  }
}

type JsonValue = string | number | boolean | null | JsonObject | JsonArray
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]
interface RouteStore {
  getRoutes: string[]
  postRoutes: string[]
  putRoutes: string[]
  deleteRoutes: string[]
}

function extractApiPatterns(jsonInput: string): RouteStore {
  function extractPatterns(obj: JsonValue): RouteStore {
    const patterns: RouteStore = {
      getRoutes: [],
      postRoutes: [],
      putRoutes: [],
      deleteRoutes: [],
    }
    if (typeof obj === 'object' && obj !== null) {
      if ('pattern' in obj && typeof obj.pattern === 'string' && obj.pattern.includes('api')) {
        const pattern = obj.pattern.replace(/^\//, '')
        if ('methods' in obj && Array.isArray(obj.methods)) {
          obj.methods.forEach((method: any) => {
            switch (method.toUpperCase()) {
              case 'GET':
                patterns.getRoutes.push(pattern)
                break
              case 'POST':
                patterns.postRoutes.push(pattern)
                break
              case 'PUT':
                patterns.putRoutes.push(pattern)
                break
              case 'DELETE':
                patterns.deleteRoutes.push(pattern)
                break
            }
          })
        }
      }
      for (const value of Object.values(obj)) {
        const subPatterns = extractPatterns(value)
        patterns.getRoutes.push(...subPatterns.getRoutes)
        patterns.postRoutes.push(...subPatterns.postRoutes)
        patterns.putRoutes.push(...subPatterns.putRoutes)
        patterns.deleteRoutes.push(...subPatterns.deleteRoutes)
      }
    }
    return patterns
  }

  // Parse the JSON input
  const data: JsonValue = JSON.parse(jsonInput)

  // Extract all patterns containing 'api'
  const apiPatterns = extractPatterns(data)
  const containsApi = (route: string) => route.includes('api')

  // Remove duplicates
  return {
    getRoutes: Array.from(new Set(apiPatterns.getRoutes)),
    postRoutes: Array.from(new Set(apiPatterns.postRoutes)),
    putRoutes: Array.from(new Set(apiPatterns.putRoutes)),
    deleteRoutes: Array.from(new Set(apiPatterns.deleteRoutes)),
  }
}
function generateRoutesFile(routes: RouteStore) {
  const baseRoute = 'api/v1'
  const fileContent = `
export const API_ROUTES = {
  GET: [${routes.getRoutes.map((route) => `'${route.replace(baseRoute, '')}'`).join(',\n    ')}] as const,
  POST: [${routes.postRoutes.map((route) => `'${route.replace(baseRoute, '')}'`).join(',\n    ')}] as const,
  PUT: [${routes.putRoutes.map((route) => `'${route.replace(baseRoute, '')}'`).join(',\n    ')}] as const,
  DELETE: [${routes.deleteRoutes.map((route) => `'${route.replace(baseRoute, '')}'`).join(',\n    ')}] as const,
};

type ReplaceParam<T extends string> =
  T extends \`\${infer Start}:\${infer Param}/\${infer Rest}\`
    ? \`\${Start}\${string}/\${ReplaceParam<Rest>}\`
    : T extends \`\${infer Start}:\${infer Param}\`
      ? \`\${Start}\${string}\`
      : T;

type TransformRoutes<T extends readonly string[]> = {
  [K in keyof T]: T[K] | ReplaceParam<T[K]>;
}[number];

export type APIRoutes = {
  [K in keyof typeof API_ROUTES]: TransformRoutes<typeof API_ROUTES[K]>;
};

export type APIRouteStatic = {
  [K in keyof typeof API_ROUTES]: typeof API_ROUTES[K][number];
};

// Usage example:
// const apiRoutes: APIRoutes = API_ROUTES as any;
`

  const filePath = path.join(process.cwd(), 'extensions', 'routes-types.ts')
  writeFileSync(filePath, fileContent, { encoding: 'utf-8' })
}

function countRoutesAndPrint(routes: RouteStore, logger: Logger) {
  // count the routes by method and then total
  const getRoutesCount = routes.getRoutes.length
  const postRoutesCount = routes.postRoutes.length
  const putRoutesCount = routes.putRoutes.length
  const deleteRoutesCount = routes.deleteRoutes.length
  const totalRoutes = getRoutesCount + postRoutesCount + putRoutesCount + deleteRoutesCount

  logger.info(`Total routes: ${totalRoutes}`)
  logger.info(`GET routes: ${getRoutesCount}`)
  logger.info(`POST routes: ${postRoutesCount}`)
  logger.info(`PUT routes: ${putRoutesCount}`)
  logger.info(`DELETE routes: ${deleteRoutesCount}`)
}
