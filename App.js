import React, { useEffect } from 'react'
import { SafeAreaView, Text } from 'react-native'
import { io } from 'socket.io-client'
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider'
import { database } from './src/database/index'
import MessageInput from './src/components/MessageInput'
import MessageList from './src/components/MessageList'
import { useNetworkSync } from './src/hooks/useNetworkSync'

const SOCKET_URL = 'https://z2x0r4x7-5000.inc1.devtunnels.ms' // your server URL

const App = () => {
  useNetworkSync()

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })

    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server')
    })

    // optional: store globally if needed
    global.socket = socket

    return () => socket.disconnect()
  }, [])

  return (
    <DatabaseProvider database={database}>
      <SafeAreaView style={{ flex: 1 }}>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 20,
            fontWeight: '600',
            marginVertical: 10,
          }}
        >
          💬 Offline Message Sync + Live WebSocket
        </Text>
        <MessageList />
        <MessageInput />
      </SafeAreaView>
    </DatabaseProvider>
  )
}

export default App
