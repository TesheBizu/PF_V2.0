import express from 'express'
import auth from '../middleware/auth.js'
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

// POST /api/projects — protected, JSON only
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, techStack, thumbnailUrl, githubUrl, liveUrl, status, featured, isVisible, order } = req.body

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' })
    }

    const parsedTech = typeof techStack === 'string'
      ? techStack.split(',').map((t) => t.trim()).filter(Boolean)
      : Array.isArray(techStack) ? techStack : []

    const validStatuses = ['active', 'completed', 'archived']
    const projectStatus = validStatuses.includes(status) ? status : 'completed'

    const project = await Project.create({
      title,
      description,
      techStack: parsedTech,
      thumbnailUrl: thumbnailUrl || null,
      githubUrl: githubUrl || null,
      liveUrl: liveUrl || null,
      status: projectStatus,
      featured: featured === 'true' || featured === true,
      isVisible: isVisible === undefined ? true : (isVisible === 'true' || isVisible === true),
      order: Number(order) || 0,
    })

    const io = req.app.get('io')
    if (io) io.emit('projects:created', project)

    return res.status(201).json(project)
  } catch (err) {
    console.error('Create project error:', err.message)
    return res.status(500).json({ message: 'Could not create project.' })
  }
})

// PUT /api/projects/:id — protected, JSON only
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }

    const { title, description, techStack, thumbnailUrl, githubUrl, liveUrl, status, featured, isVisible, order } = req.body

    if (title !== undefined) project.title = title
    if (description !== undefined) project.description = description
    if (thumbnailUrl !== undefined) project.thumbnailUrl = thumbnailUrl || null
    if (githubUrl !== undefined) project.githubUrl = githubUrl || null
    if (liveUrl !== undefined) project.liveUrl = liveUrl || null
    if (status !== undefined) {
      const validStatuses = ['active', 'completed', 'archived']
      project.status = validStatuses.includes(status) ? status : 'completed'
    }
    if (featured !== undefined) project.featured = featured === 'true' || featured === true
    if (isVisible !== undefined) project.isVisible = isVisible === 'true' || isVisible === true
    if (order !== undefined) project.order = Number(order) || 0

    if (techStack !== undefined) {
      project.techStack = typeof techStack === 'string'
        ? techStack.split(',').map((t) => t.trim()).filter(Boolean)
        : Array.isArray(techStack) ? techStack : []
    }

    await project.save()

    const io = req.app.get('io')
    if (io) io.emit('projects:updated', project)

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

    const io = req.app.get('io')
    if (io) io.emit('projects:deleted', { id: project._id })

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

    const io = req.app.get('io')
    if (io) {
      const sorted = await Project.find().sort({ order: 1 })
      io.emit('projects:reordered', sorted)
    }

    return res.json(project)
  } catch (err) {
    console.error('Reorder project error:', err.message)
    return res.status(500).json({ message: 'Could not reorder project.' })
  }
})

export default router
