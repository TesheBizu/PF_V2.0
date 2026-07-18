import express from 'express'
import auth from '../middleware/auth.js'
import Message from '../models/Message.js'

const router = express.Router()

router.get('/', auth, async (req, res) => {
  try {
    const filter = {}
    if (req.query.status) {
      filter.status = req.query.status
    }
    const messages = await Message.find(filter).sort({ createdAt: -1 })
    return res.json(messages)
  } catch (err) {
    console.error('Fetch messages error:', err.message)
    return res.status(500).json({ message: 'Could not fetch messages.' })
  }
})

router.get('/unread-count', auth, async (_req, res) => {
  try {
    const count = await Message.countDocuments({ status: 'unread' })
    return res.json({ count })
  } catch (err) {
    console.error('Unread count error:', err.message)
    return res.status(500).json({ message: 'Could not get unread count.' })
  }
})

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['unread', 'read', 'replied', 'archived']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' })
    }

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    )
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' })
    }

    const io = req.app.get('io')
    if (io) io.emit('messages:updated', message)

    return res.json(message)
  } catch (err) {
    console.error('Update message status error:', err.message)
    return res.status(500).json({ message: 'Could not update message status.' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id)
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' })
    }

    const io = req.app.get('io')
    if (io) io.emit('messages:deleted', { id: message._id })

    return res.json({ message: 'Message deleted.' })
  } catch (err) {
    console.error('Delete message error:', err.message)
    return res.status(500).json({ message: 'Could not delete message.' })
  }
})

export default router
