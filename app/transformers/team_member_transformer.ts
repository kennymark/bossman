import { BaseTransformer } from '@adonisjs/core/transformers'

import type TeamMember from '#models/team_member'
import UserTransformer from '#transformers/user_transformer'

export default class TeamMemberTransformer extends BaseTransformer<TeamMember> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'userId',
        'role',
        'enableProdAccess',
        'prodAccessMode',
        'dataAccessMode',
        'propertiesAccessMode',
        'leasesAccessMode',
        'allowedLeaseableEntityIds',
        'allowedLeaseIds',
        'allowedPages',
        'createdAt',
        'updatedAt',
      ]),
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}
