import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import withObservables from '@nozbe/with-observables';
import { database } from '../database/index';
import NetInfo from '@react-native-community/netinfo';

const MessageList = ({ messages }) => {
  const [liveData, setLiveData] = useState([]);

  const getAllData = async () => {
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        const response = await fetch(
          'https://z2x0r4x7-5000.inc1.devtunnels.ms/api/all',
        );
        const data = await response.json();
        setLiveData(data.data);
      } else {
        console.log("messages form test",messages)
        setLiveData(messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // initial fetch
  useEffect(() => {
    getAllData();
  }, []);

  useEffect(() => {
    if (messages != 0) {
      setLiveData(messages);
    }else{
      getAllData();
    }
  }, [messages]);

  // listen to socket newMessage
  useEffect(() => {
    if (!global.socket) return;

    const socket = global.socket;
    const handleNewMessage = newMsg => {
      console.log('📩 Received new message:', newMsg);
      setLiveData(prev => [newMsg, ...prev]); 
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, []);

  return (
    <>
    {console.log("liveData",liveData)}
    <FlatList
      data={[...liveData].reverse()} 
      keyExtractor={(item, index) => item._id?.toString() ?? index.toString()}
      contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => {
          const hasText = item.content || item.text;
          if (!hasText) return null;

          return (
            <View
              style={{
                backgroundColor: item.status === 'pending' ? '#fff3cd' : '#d1e7dd',
                borderRadius: 10,
                padding: 10,
                marginVertical: 5,
              }}
            >
              <Text style={{ fontSize: 16 }}>{item.content || item.text}</Text>
              <Text
                style={{
                  fontSize: 12,
                  color: item.status === 'pending' ? '#856404' : '#0f5132',
                  marginTop: 4,
                }}
              >
                {item.status ? item.status.toUpperCase() : 'SYNCED'}
              </Text>
            </View>
          );
        }}

    />
    </>
  );
};

const enhance = withObservables([], () => ({
  messages: database
    .get('messages')
    .query()
    .observeWithColumns(['content', 'status', 'created_at']),
}));

export default enhance(MessageList);
