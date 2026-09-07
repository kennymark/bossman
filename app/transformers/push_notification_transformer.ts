import { BaseTransformer } from '@adonisjs/core/transformers'

import type PushNotification from '#models/push_notification'

export default class PushNotificationTransformer extends BaseTransformer<PushNotification> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'targetType',
      'appEnv',
      'targetUserIds',
      'title',
      'description',
      'imageUrl',
      'url',
      'scheduledAt',
      'status',
      'sentAt',
      'errorMessage',
      'createdAt',
      'updatedAt',
    ])
  }
}
