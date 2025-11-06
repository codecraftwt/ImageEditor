import React, { useState } from 'react'
import { View, TextInput, Button } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { sendMessageToServer } from '../api/messageApi'
import { database } from '../database/index'

const MessageInput = () => {
  const [text, setText] = useState('')

  const handleSend = async () => {
    if (!text.trim()) return
    const netState = await NetInfo.fetch()
    const isOnline = netState.isConnected

    if (isOnline) {
      try {
        await sendMessageToServer(text)
      } catch (err) {
       await saveMessage(text, 'pending') // store only if failed
      }
    } else {
     await saveMessage(text, 'pending')
    }


    setText('')
  }

  const saveMessage = async (content, status) => {
    await database.write(async () => {
      await database.get('messages').create(msg => {
        msg.content = content
        msg.status = status
        msg.createdAt = Date.now()
      })
    })
  }

  return (
    <View style={{ flexDirection: 'row', padding: 10 }}>
      <TextInput
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 8,
          marginRight: 8,
        }}
        placeholder="Type a message"
        value={text}
        onChangeText={setText}
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  )
}

export default MessageInput
