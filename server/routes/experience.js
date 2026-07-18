import express from 'express'
import auth from '../middleware/auth.js'
import Experience from '../models/Experience.js'

const router = express.Router()

const VALID_TYPES = ['Work Experience', 'Education', 'Self-Learning']

// GET /api/experience — public, visible only, most recent first
router.get('/', async (_req, res) => {
  try {
    const entries = await Experience.find({ isVisible: true }).sort({ startDate: -1 })
    return res.json(entries)
  } catch (err) {
    console.error('Fetch experience error:', err.message)
    return res.status(500).json({ message: 'Could not fetch experience entries.' })
  }
})

// GET /api/experience/all — protected, all entries
router.get('/all', auth, async (_req, res) => {
  try {
    const entries = await Experience.find().sort({ startDate: -1 })
    return res.json(entries)
  } catch (err) {
    console.error('Fetch all experience error:', err.message)
    return res.status(500).json({ message: 'Could not fetch experience entries.' })
  }
})

// POST /api/experience — protected, JSON only
router.post('/', auth, async (req, res) => {
  try {
    const { role, company, companyUrl, logoUrl, location, startDate, endDate, type, description, order, isVisible } = req.body

    if (!role || !company || !location || !startDate) {
      return res.status(400).json({ message: 'Role, company, location, and start date are required.' })
    }

    const entryType = VALID_TYPES.includes(type) ? type : 'Work Experience'

    const parsedDesc = typeof description === 'string'
      ? description.split('\n').map((d) => d.trim()).filter(Boolean)
      : Array.isArray(description) ? description : []

    const entry = await Experience.create({
      role,
      company,
      companyUrl: companyUrl || null,
      logoUrl: logoUrl || null,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      type: entryType,
      description: parsedDesc,
      order: Number(order) || 0,
      isVisible: isVisible === undefined ? true : (isVisible === 'true' || isVisible === true),
    })

    const io = req.app.get('io')
    if (io) io.emit('experience:created', entry)

    return res.status(201).json(entry)
  } catch (err) {
    console.error('Create experience error:', err.message)
    return res.status(500).json({ message: 'Could not create experience entry.' })
  }
})

// PUT /api/experience/:id — protected, JSON only
router.put('/:id', auth, async (req, res) => {
  try {
    const entry = await Experience.findById(req.params.id)
    if (!entry) {
      return res.status(404).json({ message: 'Experience entry not found.' })
    }

    const { role, company, companyUrl, logoUrl, location, startDate, endDate, type, description, order, isVisible } = req.body

    if (role !== undefined) entry.role = role
    if (company !== undefined) entry.company = company
    if (companyUrl !== undefined) entry.companyUrl = companyUrl || null
    if (logoUrl !== undefined) entry.logoUrl = logoUrl || null
    if (location !== undefined) entry.location = location
    if (startDate !== undefined) entry.startDate = new Date(startDate)
    if (endDate !== undefined) entry.endDate = endDate ? new Date(endDate) : null
    if (type !== undefined) entry.type = VALID_TYPES.includes(type) ? type : entry.type
    if (order !== undefined) entry.order = Number(order) || 0
    if (isVisible !== undefined) entry.isVisible = isVisible === 'true' || isVisible === true

    if (description !== undefined) {
      entry.description = typeof description === 'string'
        ? description.split('\n').map((d) => d.trim()).filter(Boolean)
        : Array.isArray(description) ? description : []
    }

    await entry.save()

    const io = req.app.get('io')
    if (io) io.emit('experience:updated', entry)

    return res.json(entry)
  } catch (err) {
    console.error('Update experience error:', err.message)
    return res.status(500).json({ message: 'Could not update experience entry.' })
  }
})

// DELETE /api/experience/:id — protected
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await Experience.findByIdAndDelete(req.params.id)
    if (!entry) {
      return res.status(404).json({ message: 'Experience entry not found.' })
    }

    const io = req.app.get('io')
    if (io) io.emit('experience:deleted', { id: entry._id })

    return res.json({ message: 'Experience entry deleted.' })
  } catch (err) {
    console.error('Delete experience error:', err.message)
    return res.status(500).json({ message: 'Could not delete experience entry.' })
  }
})

// PATCH /api/experience/:id/reorder — protected
router.patch('/:id/reorder', auth, async (req, res) => {
  try {
    const { order } = req.body
    if (order === undefined) {
      return res.status(400).json({ message: 'Order value is required.' })
    }

    const entry = await Experience.findByIdAndUpdate(
      req.params.id,
      { order: Number(order) },
      { new: true },
    )
    if (!entry) {
      return res.status(404).json({ message: 'Experience entry not found.' })
    }

    const io = req.app.get('io')
    if (io) {
      const sorted = await Experience.find().sort({ startDate: -1 })
      io.emit('experience:reordered', sorted)
    }

    return res.json(entry)
  } catch (err) {
    console.error('Reorder experience error:', err.message)
    return res.status(500).json({ message: 'Could not reorder experience entry.' })
  }
})

export default router
