import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import Admin from '../models/Admin.js'

dotenv.config()

const SALT_ROUNDS = 12

async function seed() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_SEED_PASSWORD

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_SEED_PASSWORD must be set in .env')
    process.exit(1)
  }

  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const existing = await Admin.findOne({ email: email.toLowerCase() })
    if (existing) {
      console.log(`Admin already exists (${email}). Skipping seed.`)
      process.exit(0)
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    await Admin.create({ email: email.toLowerCase(), passwordHash })

    console.log(`Admin created: ${email}`)
    process.exit(0)
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
