import express from 'express'
import messageController from '../controller/messageController.js'

const router = express.Router()

router.post('/send', messageController.sendMessage)
router.get('/all', messageController.getAllMessages)


export default router
