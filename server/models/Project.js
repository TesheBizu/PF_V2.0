import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  techStack: [{ type: String, trim: true }],
  thumbnailUrl: { type: String, default: null },
  githubUrl: { type: String, default: null },
  liveUrl: { type: String, default: null },
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'completed' },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const Project = mongoose.model('Project', projectSchema)

export default Project
