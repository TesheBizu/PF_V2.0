import mongoose from 'mongoose'

const experienceSchema = new mongoose.Schema({
  role: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  companyUrl: { type: String, default: null },
  logoUrl: { type: String, default: null },
  location: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  type: {
    type: String,
    enum: ['Work Experience', 'Education', 'Self-Learning'],
    required: true,
    default: 'Work Experience',
  },
  description: [{ type: String, trim: true }],
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const Experience = mongoose.model('Experience', experienceSchema)

export default Experience
