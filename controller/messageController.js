import { Message } from '../models/Message.js'

const sendMessage = async (req, res) => {
  const { text } = req.body
  const io = req.app.get('io') // access Socket.IO instance

  if (!text) {
    return res.status(400).json({ success: false, error: 'Message text required' })
  }

  try {
    const newMsg = new Message({ text })
    await newMsg.save()

    console.log('💾 Saved message:', newMsg.text)

    // 🔥 Emit to all connected clients
    io.emit('newMessage', newMsg)
    const allMessages = await Message.find().sort({ createdAt: -1 })
    io.emit('newMessage', allMessages)


    res.status(200).json({
      success: true,
      message: 'Message stored successfully',
      data: newMsg,
    })
  } catch (err) {
    console.error('❌ Error saving message:', err.message)
    res.status(500).json({ success: false, error: 'Server error' })
  }
}

const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 })
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    })
  } catch (err) {
    console.error('❌ Error fetching messages:', err.message)
    res.status(500).json({ success: false, error: 'Server error' })
  }
}

export default { sendMessage, getAllMessages }
