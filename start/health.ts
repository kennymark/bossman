import {
  DiskSpaceCheck,
  HealthChecks,
  MemoryHeapCheck,
  MemoryRSSCheck,
} from '@adonisjs/core/health'
import { DbCheck } from '@adonisjs/lucid/database'
import db from '@adonisjs/lucid/services/db'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck().failWhenExceeds(99),
  new MemoryHeapCheck(),
  new DbCheck(db.connection('sqlite')),
  new MemoryRSSCheck().warnWhenExceeds('600 mb').failWhenExceeds('800 mb'),
])
