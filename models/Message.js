import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export const Message = mongoose.model('Message', messageSchema)
