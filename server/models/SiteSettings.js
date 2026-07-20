import mongoose from 'mongoose'

const statSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  suffix: { type: String, default: '' },
}, { _id: false })

const siteSettingsSchema = new mongoose.Schema({
  name: { type: String, required: true, default: '' },
  roles: [{ type: String, trim: true }],
  tagline: { type: String, default: '' },
  bio: [{ type: String, trim: true }],
  stats: [statSchema],
  profilePhotoUrl: { type: String, default: null },
  resumeUrl: { type: String, default: null },
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
  },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  contactLocation: { type: String, default: '' },
  footerCopyrightName: { type: String, default: '' },
}, { timestamps: true })

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema)

export default SiteSettings
