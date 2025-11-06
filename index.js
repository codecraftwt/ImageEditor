import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import messageRoutes from './routes/messageRoutes.js'

dotenv.config()

const app = express()
const server = createServer(app) // <-- important
const io = new Server(server, {
  cors: {
    origin: '*', // change to your client URL in production
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors())
app.use(bodyParser.json())

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err.message))

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id)
  })
})

// Expose `io` to routes/controllers via app locals
app.set('io', io)

// Routes
app.use('/api', messageRoutes)

// Root endpoint
app.get('/', (req, res) => res.send('🚀 Message API running with MongoDB + Socket.IO'))

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`))
