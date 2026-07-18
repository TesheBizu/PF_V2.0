import express from 'express'
import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'
import { uploadBuffer } from '../utils/cloudinary.js'

const router = express.Router()

// POST /api/upload — protected, uploads image to Cloudinary, returns { url }
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' })
    }

    const folder = req.body.folder || 'portfolio'
    const url = await uploadBuffer(req.file.buffer, folder)

    return res.status(201).json({ url })
  } catch (err) {
    console.error('Upload error:', err.message)
    return res.status(500).json({ message: 'Failed to upload file.' })
  }
})

export default router
