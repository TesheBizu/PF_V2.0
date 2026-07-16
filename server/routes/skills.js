import express from 'express'
import auth from '../middleware/auth.js'
import Skill from '../models/Skill.js'
import iconLibrary from '../data/iconLibrary.js'

const router = express.Router()

// GET /api/skills — public, visible only, sorted by category then order
router.get('/', async (_req, res) => {
  try {
    const skills = await Skill.find({ isVisible: true }).sort({ category: 1, order: 1 })
    return res.json(skills)
  } catch (err) {
    console.error('Fetch skills error:', err.message)
    return res.status(500).json({ message: 'Could not fetch skills.' })
  }
})

// GET /api/skills/all — protected, all skills
router.get('/all', auth, async (_req, res) => {
  try {
    const skills = await Skill.find().sort({ category: 1, order: 1 })
    return res.json(skills)
  } catch (err) {
    console.error('Fetch all skills error:', err.message)
    return res.status(500).json({ message: 'Could not fetch skills.' })
  }
})

// GET /api/skills/icon-library — protected, returns icon lookup list
router.get('/icon-library', auth, async (_req, res) => {
  return res.json(iconLibrary)
})

// POST /api/skills — protected, create
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, proficiency, icon, brandColor, order, isVisible } = req.body

    if (!name || !category || proficiency === undefined || !icon || !brandColor) {
      return res.status(400).json({ message: 'Name, category, proficiency, icon, and brandColor are required.' })
    }

    const skill = await Skill.create({
      name,
      category,
      proficiency: Number(proficiency),
      icon,
      brandColor,
      order: Number(order) || 0,
      isVisible: isVisible === undefined ? true : (isVisible === 'true' || isVisible === true),
    })

    const io = req.app.get('io')
    if (io) io.emit('skills:created', skill)

    return res.status(201).json(skill)
  } catch (err) {
    console.error('Create skill error:', err.message)
    return res.status(500).json({ message: 'Could not create skill.' })
  }
})

// PUT /api/skills/:id — protected, update
router.put('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' })
    }

    const { name, category, proficiency, icon, brandColor, order, isVisible } = req.body

    if (name !== undefined) skill.name = name
    if (category !== undefined) skill.category = category
    if (proficiency !== undefined) skill.proficiency = Number(proficiency)
    if (icon !== undefined) skill.icon = icon
    if (brandColor !== undefined) skill.brandColor = brandColor
    if (order !== undefined) skill.order = Number(order)
    if (isVisible !== undefined) skill.isVisible = isVisible === 'true' || isVisible === true

    await skill.save()

    const io = req.app.get('io')
    if (io) io.emit('skills:updated', skill)

    return res.json(skill)
  } catch (err) {
    console.error('Update skill error:', err.message)
    return res.status(500).json({ message: 'Could not update skill.' })
  }
})

// DELETE /api/skills/:id — protected
router.delete('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id)
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' })
    }

    const io = req.app.get('io')
    if (io) io.emit('skills:deleted', { id: skill._id })

    return res.json({ message: 'Skill deleted.' })
  } catch (err) {
    console.error('Delete skill error:', err.message)
    return res.status(500).json({ message: 'Could not delete skill.' })
  }
})

// PATCH /api/skills/:id/reorder — protected
router.patch('/:id/reorder', auth, async (req, res) => {
  try {
    const { order } = req.body
    if (order === undefined) {
      return res.status(400).json({ message: 'Order value is required.' })
    }

    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { order: Number(order) },
      { new: true },
    )
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' })
    }

    const io = req.app.get('io')
    if (io) {
      const sorted = await Skill.find().sort({ category: 1, order: 1 })
      io.emit('skills:reordered', sorted)
    }

    return res.json(skill)
  } catch (err) {
    console.error('Reorder skill error:', err.message)
    return res.status(500).json({ message: 'Could not reorder skill.' })
  }
})

export default router
