import mongoose from 'mongoose'

const analyticsSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  event: {
    type: String,
    required: true,
    enum: [
      'page_view',
      'section_view',
      'project_click',
      'form_submit',
      'terminal_command',
      'resume_download',
    ],
    index: true,
  },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  referrer: { type: String, default: '' },
  device: { type: String, default: '' },
  country: { type: String, default: null },
  timestamp: { type: Date, default: Date.now, index: true },
})

analyticsSchema.index({ event: 1, timestamp: -1 })
analyticsSchema.index({ sessionId: 1, timestamp: -1 })
analyticsSchema.index({ 'meta.section': 1, timestamp: -1 })
analyticsSchema.index({ 'meta.projectId': 1, timestamp: -1 })

const Analytics = mongoose.model('Analytics', analyticsSchema)

export default Analytics
