# ⚡ WebSocket Integration in MERN Stack

## 🧠 Overview

This project demonstrates **real-time communication** using **WebSockets** within a **MERN (MongoDB, Express, React, Node.js)** architecture.
It enables **bi-directional**, **event-driven** communication between the **client** and **server** — ideal for chat apps, live notifications, collaborative tools, or dashboards.

---

## 🚀 Features

* Real-time, persistent connection between client and server
* Event-based message handling
* Efficient, low-latency updates without polling
* Graceful connection handling (auto-reconnect, disconnect detection)
* Scalable WebSocket setup ready for production use

---

## 🏗️ Tech Stack

| Layer     | Technology                     |
| --------- | ------------------------------ |
| Frontend  | React.js / Next.js             |
| Backend   | Node.js + Express              |
| Real-time | WebSocket (native) / Socket.IO |
| Database  | MongoDB (via Mongoose)         |

> 💡 This README assumes you’re using **Socket.IO**, but the same logic applies to **native WebSockets** with minimal changes.

---

## 📦 Project Structure

```
├── backend
│   ├── server.js
│   ├── socket.js
│   ├── package.json
│   └── ...
│
├── frontend
│   ├── src
│   │   ├── App.js
│   │   ├── components
│   │   │   └── Chat.js
│   │   └── services
│   │       └── socket.js
│   ├── package.json
│   └── ...
│
└── README.md
```

---

## 🧩 1. Backend Setup

### Install Dependencies

```bash
cd backend
npm install express socket.io cors
```

### `server.js`

```javascript
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);

// ✅ Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // For production, specify your frontend domain
    methods: ['GET', 'POST'],
  },
});

// ✅ Socket Connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for messages
  socket.on('send_message', (data) => {
    console.log('Message Received:', data);
    // Broadcast to all connected clients
    io.emit('receive_message', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log('✅ Server running on port 5000');
});
```

---

## 💻 2. Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install socket.io-client
```

### `src/services/socket.js`

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // your backend URL
export default socket;
```

### `src/components/Chat.js`

```javascript
import React, { useEffect, useState } from 'react';
import socket from '../services/socket';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    // Receive messages from server
    socket.on('receive_message', (data) => {
      setChat((prev) => [...prev, data]);
    });

    // Cleanup on unmount
    return () => {
      socket.off('receive_message');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('send_message', { message, time: new Date().toLocaleTimeString() });
      setMessage('');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>💬 Real-Time Chat</h2>
      <div style={{ height: 200, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
        {chat.map((msg, index) => (
          <p key={index}>
            <strong>{msg.time}: </strong>{msg.message}
          </p>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
```

---

## 🔄 3. Run the Project

### Start Backend

```bash
cd backend
npm start
```

### Start Frontend

```bash
cd frontend
npm start
```

Then open 👉 [http://localhost:3000](http://localhost:3000)

---

## ⚙️ 4. How It Works (Step-by-Step)

| Step | Description                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------- |
| 1️⃣  | Client connects to the backend WebSocket server (handshake).                                          |
| 2️⃣  | Server acknowledges the connection and assigns a unique socket ID.                                    |
| 3️⃣  | Client emits a custom event (e.g., `send_message`).                                                   |
| 4️⃣  | Server listens for this event and can broadcast (`io.emit`) or send privately (`socket.to(id).emit`). |
| 5️⃣  | All subscribed clients receive real-time updates (`receive_message`).                                 |
| 6️⃣  | When the client disconnects, the server cleans up the connection.                                     |

---

## 🧱 5. Advanced Features (Optional)

You can extend this WebSocket setup with:

* ✅ **User rooms** → `socket.join(roomId)` for group chat
* ✅ **Private messaging** → `socket.to(targetId).emit(...)`
* ✅ **Online/offline tracking**
* ✅ **Error & retry handling**
* ✅ **Authentication via JWT tokens before connection**

Example (JWT Auth Middleware):

```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValidToken(token)) next();
  else next(new Error('Unauthorized'));
});
```

---

## 🧩 6. Common Debug Tips

| Issue                | Solution                                                     |
| -------------------- | ------------------------------------------------------------ |
| Client can’t connect | Check CORS config & correct backend URL                      |
| Duplicate messages   | Ensure `.off()` cleanup before re-binding listeners          |
| No console logs      | Verify same event name on both ends                          |
| Deploy issues        | Use a reverse proxy like NGINX for WebSocket upgrade support |

---

## 🌐 7. Production Setup

When deploying:

* Use environment variables (`.env`) for URLs
* Behind **NGINX** or **AWS ALB**, make sure **WebSocket upgrade headers** are allowed
* For scaling: use **Redis adapter** for Socket.IO (to share state between instances)

```bash
npm install socket.io-redis
```

---

## ✅ Summary

You’ve now set up:

* 🔌 Persistent WebSocket connections
* ⚡ Real-time event broadcasting
* 🔁 Scalable backend communication layer

This setup is production-ready and extendable for **chat**, **notifications**, or **live dashboards**.

---

## 🧾 License

MIT © 2025 — Maintained by the Dev Team
