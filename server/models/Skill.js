import mongoose from 'mongoose'

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Frontend', 'Backend', 'Database', 'Tools'],
  },
  proficiency: { type: Number, required: true, min: 0, max: 100 },
  icon: { type: String, required: true },
  brandColor: { type: String, required: true },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const Skill = mongoose.model('Skill', skillSchema)

export default Skill
