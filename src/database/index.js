import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import Message from './models/Message'
import { mySchema } from './schema'

const adapter = new SQLiteAdapter({
  schema: mySchema,
  dbName: 'MessagesDB',
  jsi: true,
})

export const database = new Database({
  adapter,
  modelClasses: [Message],
})
