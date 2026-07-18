import mongoose from 'mongoose'

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  company: { type: String, default: null, trim: true },
  quote: { type: String, required: true },
  photoUrl: { type: String, default: null },
  linkedinUrl: { type: String, default: null },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const Testimonial = mongoose.model('Testimonial', testimonialSchema)

export default Testimonial
