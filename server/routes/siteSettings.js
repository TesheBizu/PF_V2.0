import express from 'express'
import multer from 'multer'
import auth from '../middleware/auth.js'
import { uploadBuffer } from '../utils/cloudinary.js'
import SiteSettings from '../models/SiteSettings.js'

const router = express.Router()

const settingsUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.fieldname === 'profilePhoto') {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (allowed.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('Profile photo must be JPG, PNG or WebP.'))
      }
    } else if (file.fieldname === 'resume') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true)
      } else {
        cb(new Error('Resume must be a PDF.'))
      }
    } else {
      cb(new Error('Unexpected field.'))
    }
  },
})

const DEFAULTS = {
  name: '',
  roles: [],
  tagline: '',
  bio: [],
  stats: [],
  profilePhotoUrl: null,
  resumeUrl: null,
  socialLinks: { github: '', linkedin: '', twitter: '' },
  contactEmail: '',
  contactPhone: '',
  contactLocation: '',
  footerCopyrightName: '',
}

router.get('/', async (_req, res) => {
  try {
    const settings = await SiteSettings.findOne()
    return res.json(settings || { ...DEFAULTS })
  } catch (err) {
    console.error('Fetch settings error:', err.message)
    return res.status(500).json({ message: 'Could not fetch settings.' })
  }
})

router.put(
  '/',
  auth,
  settingsUpload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const fields = req.body
      const files = req.files || {}

      let profilePhotoUrl = fields.existingProfilePhotoUrl || null
      let resumeUrl = fields.existingResumeUrl || null

      if (files.profilePhoto) {
        profilePhotoUrl = await uploadBuffer(
          files.profilePhoto[0].buffer,
          'portfolio/settings',
          'image',
        )
      } else if (fields.removeProfilePhoto === 'true') {
        profilePhotoUrl = null
      }

      if (files.resume) {
        resumeUrl = await uploadBuffer(
          files.resume[0].buffer,
          'portfolio/settings',
          'raw',
        )
      } else if (fields.removeResume === 'true') {
        resumeUrl = null
      }

      const parseArray = (val) => {
        if (Array.isArray(val)) return val.filter(Boolean)
        if (typeof val === 'string') return val ? [val] : []
        return []
      }

      const parseStats = (val) => {
        if (Array.isArray(val)) return val
        if (typeof val === 'string') {
          try {
            return JSON.parse(val)
          } catch {
            return []
          }
        }
        return []
      }

      const data = {
        name: fields.name || '',
        roles: parseArray(fields.roles),
        tagline: fields.tagline || '',
        bio: parseArray(fields.bio),
        stats: parseStats(fields.stats),
        profilePhotoUrl,
        resumeUrl,
        socialLinks: {
          github: fields['socialLinks.github'] || '',
          linkedin: fields['socialLinks.linkedin'] || '',
          twitter: fields['socialLinks.twitter'] || '',
        },
        contactEmail: fields.contactEmail || '',
        contactPhone: fields.contactPhone || '',
        contactLocation: fields.contactLocation || '',
        footerCopyrightName: fields.footerCopyrightName || '',
      }

      const settings = await SiteSettings.findOneAndUpdate({}, data, {
        upsert: true,
        new: true,
      })

      const io = req.app.get('io')
      if (io) io.emit('settings:updated', settings)

      return res.json(settings)
    } catch (err) {
      console.error('Update settings error:', err.message)
      return res.status(500).json({ message: 'Could not update settings.' })
    }
  },
)

router.get('/resume-download', async (req, res) => {
  try {
    const settings = await SiteSettings.findOne()
    if (!settings?.resumeUrl) {
      return res.status(404).json({ message: 'No resume available.' })
    }

    const filename = settings.name
      ? `${settings.name.replace(/\s+/g, '_')}_CV.pdf`
      : 'resume.pdf'

    const response = await fetch(settings.resumeUrl)
    if (!response.ok) {
      return res.status(502).json({ message: 'Failed to fetch resume from storage.' })
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/pdf')

    const buffer = Buffer.from(await response.arrayBuffer())
    res.end(buffer)
  } catch (err) {
    console.error('Resume download error:', err.message)
    return res.status(500).json({ message: 'Could not download resume.' })
  }
})

export default router
