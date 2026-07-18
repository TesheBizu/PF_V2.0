import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import passport from 'passport'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'
import contactRouter from './routes/contact.js'
import githubRouter from './routes/github.js'
import authRouter from './routes/auth.js'
import projectsRouter from './routes/projects.js'
import skillsRouter from './routes/skills.js'
import experienceRouter from './routes/experience.js'
import uploadRouter from './routes/upload.js'
import testimonialsRouter from './routes/testimonials.js'
import messagesRouter from './routes/messages.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

const allowedOrigins = [
  process.env.PUBLIC_CLIENT_URL || 'http://localhost:5173',
  process.env.ADMIN_CLIENT_URL || 'http://localhost:5174',
]

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
})

app.set('io', io)

app.use(helmet())
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(passport.initialize())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/skills', skillsRouter)
app.use('/api/experience', experienceRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/contact', contactRouter)
app.use('/api/github', githubRouter)
app.use('/api/testimonials', testimonialsRouter)
app.use('/api/messages', messagesRouter)

const start = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI)
      console.log('MongoDB connected')
    } else {
      console.warn('MONGO_URI not set — running without database')
    }

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

start()
