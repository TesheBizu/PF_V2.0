import express from 'express'
import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'
import { uploadBuffer } from '../utils/cloudinary.js'
import Testimonial from '../models/Testimonial.js'

const router = express.Router()

// GET /api/testimonials — public, visible only
router.get('/', async (_req, res) => {
  try {
    const testimonials = await Testimonial.find({ isVisible: true }).sort({ order: 1 })
    return res.json(testimonials)
  } catch (err) {
    console.error('Fetch testimonials error:', err.message)
    return res.status(500).json({ message: 'Could not fetch testimonials.' })
  }
})

// GET /api/testimonials/all — protected, all testimonials
router.get('/all', auth, async (_req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1 })
    return res.json(testimonials)
  } catch (err) {
    console.error('Fetch all testimonials error:', err.message)
    return res.status(500).json({ message: 'Could not fetch testimonials.' })
  }
})

// POST /api/testimonials — protected, multipart with optional photo
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const { name, role, company, quote, linkedinUrl, isVisible, order } = req.body

    if (!name || !role || !quote) {
      return res.status(400).json({ message: 'Name, role, and quote are required.' })
    }

    let photoUrl = null
    if (req.file) {
      photoUrl = await uploadBuffer(req.file.buffer, 'portfolio/testimonials')
    }

    const testimonial = await Testimonial.create({
      name,
      role,
      company: company || null,
      quote,
      photoUrl,
      linkedinUrl: linkedinUrl || null,
      isVisible: isVisible === undefined ? true : (isVisible === 'true' || isVisible === true),
      order: Number(order) || 0,
    })

    const io = req.app.get('io')
    if (io) io.emit('testimonials:created', testimonial)

    return res.status(201).json(testimonial)
  } catch (err) {
    console.error('Create testimonial error:', err.message)
    return res.status(500).json({ message: 'Could not create testimonial.' })
  }
})

// PUT /api/testimonials/:id — protected, multipart with optional photo
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id)
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found.' })
    }

    const { name, role, company, quote, linkedinUrl, isVisible, order, removePhoto } = req.body

    if (name !== undefined) testimonial.name = name
    if (role !== undefined) testimonial.role = role
    if (company !== undefined) testimonial.company = company || null
    if (quote !== undefined) testimonial.quote = quote
    if (linkedinUrl !== undefined) testimonial.linkedinUrl = linkedinUrl || null
    if (isVisible !== undefined) testimonial.isVisible = isVisible === 'true' || isVisible === true
    if (order !== undefined) testimonial.order = Number(order) || 0

    if (req.file) {
      testimonial.photoUrl = await uploadBuffer(req.file.buffer, 'portfolio/testimonials')
    } else if (removePhoto === 'true') {
      testimonial.photoUrl = null
    }

    await testimonial.save()

    const io = req.app.get('io')
    if (io) io.emit('testimonials:updated', testimonial)

    return res.json(testimonial)
  } catch (err) {
    console.error('Update testimonial error:', err.message)
    return res.status(500).json({ message: 'Could not update testimonial.' })
  }
})

// DELETE /api/testimonials/:id — protected
router.delete('/:id', auth, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id)
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found.' })
    }

    const io = req.app.get('io')
    if (io) io.emit('testimonials:deleted', { id: testimonial._id })

    return res.json({ message: 'Testimonial deleted.' })
  } catch (err) {
    console.error('Delete testimonial error:', err.message)
    return res.status(500).json({ message: 'Could not delete testimonial.' })
  }
})

// PATCH /api/testimonials/:id/reorder — protected
router.patch('/:id/reorder', auth, async (req, res) => {
  try {
    const { order } = req.body
    if (order === undefined) {
      return res.status(400).json({ message: 'Order value is required.' })
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { order: Number(order) },
      { new: true },
    )
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found.' })
    }

    const io = req.app.get('io')
    if (io) {
      const sorted = await Testimonial.find().sort({ order: 1 })
      io.emit('testimonials:reordered', sorted)
    }

    return res.json(testimonial)
  } catch (err) {
    console.error('Reorder testimonial error:', err.message)
    return res.status(500).json({ message: 'Could not reorder testimonial.' })
  }
})

export default router
