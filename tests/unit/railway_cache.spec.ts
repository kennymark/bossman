import cache from '@adonisjs/cache/services/main'
import { test } from '@japa/runner'

import { RailwayApiService } from '#services/railway_service'

/**
 * Railway reads are cached.
 *
 * Every read used to issue a fresh GraphQL round trip: opening `/servers`, sorting it,
 * or reloading hit the API again, and `/servers/:id` did it server-side before the
 * response was even sent. These cases pin that repeat reads are served from cache, that
 * there is still a way to force a fresh read, and that a mutation drops what it changed.
 */
test.group('Railway caching', (group) => {
  group.each.setup(async () => {
    await cache.clear()
  })

  /** Replaces the GraphQL call with a counter, so we can see how often it is reached. */
  function countingService() {
    const service = new RailwayApiService()
    let calls = 0

    Object.assign(service, {
      fetchProjects: async () => {
        calls += 1
        return [{ id: 'p1', name: 'api', description: null, createdAt: '', updatedAt: '' }]
      },
      fetchProject: async (id: string) => {
        calls += 1
        return {
          id,
          name: 'api',
          description: null,
          createdAt: '',
          updatedAt: '',
          services: [],
          environments: [],
        }
      },
    })

    return { service, calls: () => calls }
  }

  test('a repeated project list is served from cache', async ({ assert }) => {
    const { service, calls } = countingService()

    const first = await service.listProjects()
    const second = await service.listProjects()
    const third = await service.listProjects()

    assert.equal(calls(), 1)
    assert.deepEqual(first, second)
    assert.deepEqual(second, third)
  })

  test('forceFresh bypasses the cache and refills it', async ({ assert }) => {
    const { service, calls } = countingService()

    await service.listProjects()
    assert.equal(calls(), 1)

    await service.listProjects({ forceFresh: true })
    assert.equal(calls(), 2)

    /** The forced read refilled the cache, so the next one is cheap again. */
    await service.listProjects()
    assert.equal(calls(), 2)
  })

  test('each project is cached under its own key', async ({ assert }) => {
    const { service, calls } = countingService()

    await service.getProject('project-a')
    await service.getProject('project-b')
    await service.getProject('project-a')

    assert.equal(calls(), 2)
  })

  test('invalidateAll drops every cached read', async ({ assert }) => {
    const { service, calls } = countingService()

    await service.listProjects()
    await service.getProject('project-a')
    assert.equal(calls(), 2)

    await service.invalidateAll()

    await service.listProjects()
    await service.getProject('project-a')
    assert.equal(calls(), 4)
  })

  /**
   * A cached "before" state after a redeploy would look like the button did nothing,
   * which is worse than the extra round trip.
   */
  test('a cached read survives an unrelated call but not invalidation', async ({ assert }) => {
    const { service, calls } = countingService()

    await service.listProjects()
    await service.getProject('project-a')
    await service.listProjects()
    assert.equal(calls(), 2)

    await service.invalidateAll()
    await service.listProjects()
    assert.equal(calls(), 3)
  })
})
