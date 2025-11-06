import React, { useState } from 'react';
import { View, Text, Button, FlatList, TextInput } from 'react-native';
import withObservables from '@nozbe/with-observables';
import { database } from '../database';

function HomeScreenBase({ posts }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const createPost = async () => {
    if (!title) return;
    await database.write(async () => {
      await database.get('posts').create(post => {
        post.title = title;
        post.body = body;
        post.createdAt = Date.now();
      });
    });
    setTitle('');
    setBody('');
  };

    const updatePost = async (post) => {
      console.log("testing update",post);
      await database.write(async () => {
        await post.update(p => {
          p.title = `${p.title} (Updated)`; // update title
          p.body = p.body; // or any changes you want
        });
      });
    };


  const deletePost = async (post) => {
    await database.write(async () => {
      await post.deletePost();
    });
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Create Post</Text>

      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, marginVertical: 5, padding: 8 }}
      />
      <TextInput
        placeholder="Body"
        value={body}
        onChangeText={setBody}
        style={{ borderWidth: 1, marginVertical: 5, padding: 8 }}
      />
      <Button title="Add Post" onPress={createPost} />

      <Text style={{ fontSize: 18, marginTop: 20, fontWeight: 'bold' }}>All Posts</Text>
      {console.log("posts",posts)}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }}>
            <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
            <Text>{item.body}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <Button title="Edit" onPress={() => updatePost(item)} />
              <View style={{ width: 10 }} />
              <Button title="Delete" color="red" onPress={() => deletePost(item)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const enhance = withObservables([], () => ({
  posts: database.get('posts').query().observe(),
}));

export const HomeScreen = enhance(HomeScreenBase);
