import { useEffect, useRef } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { database } from '../database/index'
import { sendMessageToServer } from '../api/messageApi'

export const useNetworkSync = () => {
  const syncingRef = useRef(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async state => {
      if (state.isConnected && !syncingRef.current) {
        syncingRef.current = true
        console.log('🌐 Online — syncing pending messages...')

        try {
          const messages = await database.get('messages').query().fetch()
          const pending = messages.filter(m => m.status === 'pending')

          for (const msg of pending) {
            try {
              await sendMessageToServer(msg.content)

              await database.write(async () => {
                await msg.markAsDeleted()
                await msg.destroyPermanently()
              })

              console.log('✅ Synced & deleted message:', msg.content)
            } catch (err) {
              console.log('❌ Sync failed:', err.message)
            }
          }
        } catch (err) {
          console.log('⚠️ Error fetching messages:', err.message)
        }

        // reset guard after short delay
        setTimeout(() => {
          syncingRef.current = false
        }, 3000)
      }
    })

    return () => unsubscribe()
  }, [])
}
