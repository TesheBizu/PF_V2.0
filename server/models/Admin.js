import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  googleId: { type: String, default: null },
  totpSecret: { type: String, default: null },
  totpEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

const Admin = mongoose.model('Admin', adminSchema)

export default Admin
