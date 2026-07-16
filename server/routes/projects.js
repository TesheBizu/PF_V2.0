import express from 'express'
import auth from '../middleware/auth.js'
import upload from '../middleware/upload.js'
import { uploadBuffer } from '../utils/cloudinary.js'
import Project from '../models/Project.js'

const router = express.Router()

// GET /api/projects — public, visible only
router.get('/', async (_req, res) => {
  try {
    const projects = await Project.find({ isVisible: true }).sort({ order: 1 })
    return res.json(projects)
  } catch (err) {
    console.error('Fetch projects error:', err.message)
    return res.status(500).json({ message: 'Could not fetch projects.' })
  }
})

// GET /api/projects/all — protected, all projects
router.get('/all', auth, async (_req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1 })
    return res.json(projects)
  } catch (err) {
    console.error('Fetch all projects error:', err.message)
    return res.status(500).json({ message: 'Could not fetch projects.' })
  }
})

// POST /api/projects — protected, create with optional image
router.post('/', auth, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, techStack, githubUrl, liveUrl, featured, isVisible, order } = req.body

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' })
    }

    let thumbnailUrl = null
    if (req.file) {
      thumbnailUrl = await uploadBuffer(req.file.buffer, 'portfolio/projects')
    }

    const parsedTech = typeof techStack === 'string'
      ? techStack.split(',').map((t) => t.trim()).filter(Boolean)
      : Array.isArray(techStack) ? techStack : []

    const project = await Project.create({
      title,
      description,
      techStack: parsedTech,
      thumbnailUrl,
      githubUrl: githubUrl || null,
      liveUrl: liveUrl || null,
      featured: featured === 'true' || featured === true,
      isVisible: isVisible === undefined ? true : (isVisible === 'true' || isVisible === true),
      order: Number(order) || 0,
    })

    return res.status(201).json(project)
  } catch (err) {
    console.error('Create project error:', err.message)
    return res.status(500).json({ message: 'Could not create project.' })
  }
})

// PUT /api/projects/:id — protected, update with optional new image
router.put('/:id', auth, upload.single('thumbnail'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }

    const { title, description, techStack, githubUrl, liveUrl, featured, isVisible, order } = req.body

    if (title !== undefined) project.title = title
    if (description !== undefined) project.description = description
    if (githubUrl !== undefined) project.githubUrl = githubUrl || null
    if (liveUrl !== undefined) project.liveUrl = liveUrl || null
    if (featured !== undefined) project.featured = featured === 'true' || featured === true
    if (isVisible !== undefined) project.isVisible = isVisible === 'true' || isVisible === true
    if (order !== undefined) project.order = Number(order) || 0

    if (techStack !== undefined) {
      project.techStack = typeof techStack === 'string'
        ? techStack.split(',').map((t) => t.trim()).filter(Boolean)
        : Array.isArray(techStack) ? techStack : []
    }

    if (req.file) {
      project.thumbnailUrl = await uploadBuffer(req.file.buffer, 'portfolio/projects')
    }

    await project.save()
    return res.json(project)
  } catch (err) {
    console.error('Update project error:', err.message)
    return res.status(500).json({ message: 'Could not update project.' })
  }
})

// DELETE /api/projects/:id — protected
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    return res.json({ message: 'Project deleted.' })
  } catch (err) {
    console.error('Delete project error:', err.message)
    return res.status(500).json({ message: 'Could not delete project.' })
  }
})

// PATCH /api/projects/:id/reorder — protected
router.patch('/:id/reorder', auth, async (req, res) => {
  try {
    const { order } = req.body
    if (order === undefined) {
      return res.status(400).json({ message: 'Order value is required.' })
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { order: Number(order) },
      { new: true },
    )
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    return res.json(project)
  } catch (err) {
    console.error('Reorder project error:', err.message)
    return res.status(500).json({ message: 'Could not reorder project.' })
  }
})

export default router
