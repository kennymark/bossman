import logger from '@adonisjs/core/services/logger'
import type { ModelObject } from '@adonisjs/lucid/types/model'
import axios from 'axios'

import env from '#start/env'

const twistApi = axios.create({
  baseURL: 'https://api.twist.com/api/v3',
  headers: {
    Authorization: `Bearer ${env.get('TWIST_TOKEN')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
})

const Channel = {
  GENERAL: 728808,
  PAYMENT: 728807,
}

const ReportType = {
  GENERAL: 6102597,
  JOBS: 6102630,
  CRITICAL: 6102601,
  PLAID: 6102589,
  STRIPE: 6102588,
}

const makeData = (channelId: number, threadId: number, msg: string) => {
  const data = new URLSearchParams()
  data.append('channel_id', channelId.toString())
  data.append('thread_id', threadId.toString())
  data.append('recipients', 'EVERYONE')
  data.append('content', msg)

  return data
}

export class SnitchService {
  constructor() {}

  static report = {
    general: async (msg: string, _info?: ModelObject) => {
      const data = makeData(Channel.GENERAL, ReportType.GENERAL, msg)
      try {
        logger.info(msg)
        const response = await twistApi.post('/comments/add', data)
        logger.info('Server notification sent', { response })
      } catch (err) {
        logger.error({ err }, 'Snitch request failed')
        logger.error(err)
      }
    },
    job: async (msg: string, info?: ModelObject) => {
      try {
        logger.info(msg)
        const parsedInfo = `${msg}\n ${JSON.stringify(info)}`
        const data = makeData(Channel.GENERAL, ReportType.JOBS, parsedInfo)
        await twistApi.post('/comments/add', data)
        logger.info('Job reported')
      } catch (err) {
        logger.error({ err }, 'Snitch request failed')
        logger.error('Job reporting failed')
      }
    },
    plaid: async (msg: string, info?: ModelObject) => {
      try {
        logger.info(msg)
        const parsedInfo = `${msg}\n ${JSON.stringify(info)}`
        const data = makeData(Channel.PAYMENT, ReportType.PLAID, parsedInfo)
        await twistApi.post('/comments/add', data)
        logger.info('Plaid notification sent')
      } catch (err) {
        logger.error({ err }, 'Snitch request failed')
        logger.error(err)
      }
    },
    stripe: async (msg: string, info?: ModelObject) => {
      try {
        const parsedInfo = `${msg}\n ${JSON.stringify(info)}`
        const data = makeData(Channel.PAYMENT, ReportType.STRIPE, parsedInfo)
        await twistApi.post('/comments/add', data)
        logger.info('Stripe notification sent')
      } catch (err) {
        logger.error({ err }, 'Snitch request failed')
        logger.error(err)
      }
    },
    critical: async (msg: string, info?: ModelObject) => {
      try {
        logger.error(msg)

        const parsedInfo = `${msg}\n ${JSON.stringify(info)}`
        const data = makeData(Channel.GENERAL, ReportType.CRITICAL, parsedInfo)
        await twistApi.post('/comments/add', data)
        logger.info('Critical notification sent')
      } catch (err) {
        logger.error({ err }, 'Snitch request failed')
        logger.error(err)
      }
    },
  }
}
