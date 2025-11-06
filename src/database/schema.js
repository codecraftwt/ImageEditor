import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'content', type: 'string' },
        { name: 'status', type: 'string' }, // 'pending' | 'sent'
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
})
