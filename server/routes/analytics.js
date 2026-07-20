import express from 'express'
import rateLimit from 'express-rate-limit'
import { UAParser } from 'ua-parser-js'
import auth from '../middleware/auth.js'
import Analytics from '../models/Analytics.js'

const router = express.Router()

const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many events. Slow down.' },
})

router.post('/track', trackLimiter, async (req, res) => {
  try {
    const { sessionId, event, meta } = req.body

    if (!sessionId || !event) {
      return res.status(400).json({ message: 'sessionId and event are required.' })
    }

    const ua = req.headers['user-agent'] || ''
    const parser = new UAParser(ua)
    const device = parser.getDevice().type || 'desktop'
    const os = parser.getOS().name || 'Unknown'

    const doc = new Analytics({
      sessionId,
      event,
      meta: meta || {},
      referrer: req.headers.referer || req.headers.referrer || '',
      device: `${device}/${os}`,
      timestamp: new Date(),
    })

    await doc.save()

    const io = req.app.get('io')
    if (io) io.emit('analytics:event', { event: doc.event })

    return res.status(201).json({ ok: true })
  } catch (err) {
    console.error('Track error:', err.message)
    return res.status(500).json({ message: 'Could not save event.' })
  }
})

router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 7
    const validDays = [7, 30, 90]
    const range = validDays.includes(days) ? days : 7
    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000)

    const match = { timestamp: { $gte: since } }

    const [viewsOverTime, referrers, devices, topSections, topProjects, commands, resumeDownloads, funnel, totals] =
      await Promise.all([
        Analytics.aggregate([
          { $match: { ...match, event: 'page_view' } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              date: '$_id',
              count: 1,
            },
          },
        ]),

        Analytics.aggregate([
          { $match: { ...match, event: 'page_view' } },
          { $group: { _id: '$referrer', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $project: { _id: 0, referrer: '$_id', count: 1 } },
        ]),

        Analytics.aggregate([
          { $match: { ...match, event: 'page_view' } },
          { $group: { _id: '$device', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, device: '$_id', count: 1 } },
        ]),

        Analytics.aggregate([
          { $match: { ...match, event: 'section_view' } },
          { $group: { _id: '$meta.section', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, section: '$_id', count: 1 } },
        ]),

        Analytics.aggregate([
          { $match: { ...match, event: 'project_click' } },
          {
            $group: {
              _id: { projectId: '$meta.projectId', projectTitle: '$meta.projectTitle' },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 20 },
          {
            $project: {
              _id: 0,
              projectId: '$_id.projectId',
              projectTitle: '$_id.projectTitle',
              count: 1,
            },
          },
        ]),

        Analytics.aggregate([
          { $match: { ...match, event: 'terminal_command' } },
          { $group: { _id: '$meta.command', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
          { $project: { _id: 0, command: '$_id', count: 1 } },
        ]),

        Analytics.countDocuments({ ...match, event: 'resume_download' }),

        Analytics.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$event',
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: null,
              data: { $push: { k: '$_id', v: '$count' } },
            },
          },
          { $replaceRoot: { newRoot: { $arrayToObject: '$data' } } },
        ]),

        Promise.all([
          Analytics.countDocuments({ ...match, event: 'page_view' }),
          Analytics.distinct('sessionId', match).then((ids) => ids.length),
        ]),
      ])

    const contactViews = funnel[0]?.section_view
      ? await Analytics.countDocuments({ ...match, event: 'section_view', 'meta.section': 'contact' })
      : 0
    const formSubmits = funnel[0]?.form_submit || 0

    const totalPageViews = totals[0]
    const uniqueSessions = totals[1]

    return res.json({
      range,
      totals: {
        totalPageViews,
        uniqueSessions,
        resumeDownloads,
      },
      viewsOverTime,
      referrers,
      devices,
      topSections,
      topProjects,
      commands,
      contactFunnel: {
        sectionViews: contactViews,
        formSubmits,
        conversionRate:
          contactViews > 0
            ? Math.round((formSubmits / contactViews) * 10000) / 100
            : 0,
      },
    })
  } catch (err) {
    console.error('=== ANALYTICS SUMMARY ERROR ===')
    console.error(err)
    console.error('===============================')
    return res.status(500).json({ message: 'Could not fetch analytics summary.' })
  }
})

export default router
