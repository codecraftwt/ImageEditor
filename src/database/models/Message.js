import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class Message extends Model {
  static table = 'messages'

  @field('content') content
  @field('status') status
  @date('created_at') createdAt
}
