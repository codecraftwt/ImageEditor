# 📱 WatermelonDB React Native CRUD Example
````markdown

A simple **React Native** project demonstrating how to use **WatermelonDB** with **SQLite** to perform offline CRUD (Create, Read, Update, Delete) operations.

## 🧩 Features
- Offline-first local database using **WatermelonDB**
- SQLite storage via **react-native-quick-sqlite**
- CRUD operations (Create, Read, Update, Delete)
- Real-time UI updates with **@nozbe/with-observables**
- Babel configuration for decorators

````

## ⚙️ 1. Create a New React Native Project

```bash
npx @react-native-community/cli init WatermelonDB
cd WatermelonDB
````



## 📦 2. Install Required Packages

```bash
npm install @nozbe/watermelondb @nozbe/with-observables react-native-quick-sqlite --legacy-peer-deps
```

---

## 🧠 3. Install Babel Plugins for Decorators

WatermelonDB uses decorators (like `@field`, `@date`), so we need Babel support.

```bash
npm install --save-dev @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties --legacy-peer-deps
```

---

## 🔧 4. Configure Babel

Edit **`babel.config.js`**:

```js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ],
};
```

---

## 🧹 5. Clear Metro Cache

After updating Babel, clear the cache:

```bash
npx react-native start --reset-cache
# or for Expo:
npx expo start -c
```

---

## 🗂️ 6. Folder Structure

```
src/
 ├── database/
 │     ├── schema.js
 │     ├── models/
 │     │     └── Post.js
 │     └── index.js
 └── screens/
       └── HomeScreen.js
```

---

## 🧾 7. Define Schema — `src/database/schema.js`

```js
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'posts',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
```

---

## 🧱 8. Create Model — `src/database/models/Post.js`

```js
import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export class Post extends Model {
  static table = 'posts';

  @field('title') title;
  @field('body') body;
  @date('created_at') createdAt;

  async updatePost(newTitle, newBody) {
    await this.update(post => {
      post.title = newTitle;
      post.body = newBody;
    });
  }

  async deletePost() {
    await this.markAsDeleted();
    await this.destroyPermanently();
  }
}
```

---

## 🗄️ 9. Initialize Database — `src/database/index.js`

```js
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from './schema';
import { Post } from './models/Post';

const adapter = new SQLiteAdapter({
  schema: mySchema,
  dbName: 'WatermelonDBDemo',
  synchronous: false,
});

export const database = new Database({
  adapter,
  modelClasses: [Post],
  actionsEnabled: true,
});
```

---

## 💬 10. Build CRUD Screen — `src/screens/HomeScreen.js`

```js
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
    await database.write(async () => {
      await post.updatePost(`${post.title} (Updated)`, post.body);
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
```

---

## ⚛️ 11. Connect Screen — `App.js`

```js
import React from 'react';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  return <HomeScreen />;
}
```

---

## ▶️ 12. Run the App

```bash
npm run android
# or
npm run ios
```

---

## 🧠 Notes

* Make sure you’ve linked `react-native-quick-sqlite` properly.
* Clear Metro cache if you see decorator-related errors.
* WatermelonDB is optimized for **offline sync** and **performance** — ideal for scalable local data management.

---

## 📚 Resources

* [WatermelonDB Documentation](https://nozbe.github.io/WatermelonDB/)
* [React Native Quick SQLite](https://github.com/ospfranco/react-native-quick-sqlite)
