import express from 'express'
import rateLimit from 'express-rate-limit'
import Message from '../models/Message.js'
import sendEmail from '../utils/sendEmail.js'

const router = express.Router()

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many messages sent from this address. Please try again later.',
  },
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/', contactLimiter, async (req, res) => {
  const { name, email, message } = req.body || {}

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ message: 'Name, email and message are all required.' })
  }

  if (!EMAIL_RE.test(String(email))) {
    return res.status(400).json({ message: 'Please provide a valid email address.' })
  }

  if (typeof message !== 'string' || message.trim().length < 10) {
    return res
      .status(400)
      .json({ message: 'Message must be at least 10 characters.' })
  }

  try {
    const saved = await Message.create({ name, email, message })

    const io = req.app.get('io')
    if (io) io.emit('messages:created', saved)

    // Notification email is a nice-to-have: failures must not block the response
    try {
      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: `[Portfolio] New message from ${name}`,
        text: `New contact message\n\nFrom: ${name} <${email}>\n\n${message}`,
        html: `
          <h3>New contact message</h3>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br/>')}</p>
        `,
      })
    } catch (emailErr) {
      console.error('Email send failed:', emailErr)
    }

    return res.status(201).json({ message: 'Message received', id: saved._id })
  } catch (err) {
    console.error('Failed to save message:', err.message)
    return res
      .status(500)
      .json({ message: 'Could not save your message. Please try again later.' })
  }
})

export default router
