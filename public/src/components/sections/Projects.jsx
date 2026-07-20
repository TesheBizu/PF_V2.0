import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import api from '../../lib/api'
import socket from '../../lib/socket'
import TerminalReveal from '../ui/TerminalReveal'
import { GitHubIcon, ExternalLinkIcon } from '../ui/icons'
import { trackEvent } from '../../lib/analytics'

function mapProject(p) {
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    techStack: p.techStack,
    thumbnail: p.thumbnailUrl,
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    featured: p.featured,
  }
}

export default function Projects() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'

  const sectionRef = useRef(null)
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.3 })

  useEffect(() => {
    if (sectionInView) trackEvent('section_view', { section: 'projects' })
  }, [sectionInView])

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get('/projects')
      .then((res) => {
        if (!cancelled) setProjects(res.data.map(mapProject))
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load projects.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('projects:created', (p) => {
      if (p.isVisible) setProjects((prev) => [...prev, mapProject(p)])
    })

    socket.on('projects:updated', (p) => {
      setProjects((prev) => {
        const exists = prev.some((x) => x.id === p._id)
        if (p.isVisible) {
          return exists
            ? prev.map((x) => (x.id === p._id ? mapProject(p) : x))
            : [...prev, mapProject(p)]
        }
        return exists ? prev.filter((x) => x.id !== p._id) : prev
      })
    })

    socket.on('projects:deleted', ({ id }) => {
      setProjects((prev) => prev.filter((x) => x.id !== id))
    })

    socket.on('projects:reordered', (list) => {
      setProjects(list.filter((p) => p.isVisible).map(mapProject))
    })

    return () => {
      socket.off('projects:created')
      socket.off('projects:updated')
      socket.off('projects:deleted')
      socket.off('projects:reordered')
      socket.disconnect()
    }
  }, [])

  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'

  const cardBg = isMatrix ? 'bg-bg-surface border-matrix-green/15' : 'bg-white border-gray-200'
  const cardHoverGlow = isMatrix
    ? 'shadow-[0_0_24px_-6px_var(--color-matrix-green)]'
    : 'shadow-[0_0_24px_-6px_var(--color-bluepill-accent)]'
  const cardBorderHover = isMatrix
    ? 'border-matrix-green/40'
    : 'border-bluepill-accent/40'
  const titleColor = isMatrix ? 'text-text-primary' : 'text-gray-900'
  const descColor = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'
  const gradientEnd = isMatrix ? 'from-bg-surface' : 'from-white'
  const tagBorder = isMatrix ? 'border-matrix-green/20' : 'border-bluepill-accent/20'
  const tagText = isMatrix ? 'text-matrix-green/70' : 'text-bluepill-accent-dark'
  const tagBg = isMatrix ? 'bg-matrix-dim/30' : 'bg-bluepill-accent/5'
  const indexColor = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark/60'

  const openBtnCls = isMatrix
    ? 'bg-matrix-green text-bg-void hover:bg-matrix-green/90'
    : 'bg-bluepill-accent text-white hover:bg-bluepill-accent-dark'
  const sourceBtnCls = isMatrix
    ? 'border border-matrix-green/40 text-matrix-green hover:bg-matrix-green/10'
    : 'border border-bluepill-accent/40 text-bluepill-accent-dark hover:bg-bluepill-accent/10'

  return (
    <section ref={sectionRef} id="projects" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2
          className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}
        >
          <span className={accent}>&gt;</span>{' '}
          <TerminalReveal mode="type" text="ls projects/" as="span" />
        </h2>
        <p className={`mb-12 font-mono text-sm ${muted}`}>
          <span className="opacity-60">$</span> listing repositories...
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`animate-pulse rounded-xl border ${cardBg}`}>
                <div className={`aspect-video ${isMatrix ? 'bg-matrix-dim/20' : 'bg-gray-200'}`} />
                <div className="p-4 space-y-3">
                  <div className={`h-5 w-3/4 rounded ${isMatrix ? 'bg-matrix-dim/20' : 'bg-gray-200'}`} />
                  <div className={`h-3 w-full rounded ${isMatrix ? 'bg-matrix-dim/20' : 'bg-gray-200'}`} />
                  <div className="flex gap-2">
                    <div className={`h-8 flex-1 rounded ${isMatrix ? 'bg-matrix-dim/20' : 'bg-gray-200'}`} />
                    <div className={`h-8 flex-1 rounded ${isMatrix ? 'bg-matrix-dim/20' : 'bg-gray-200'}`} />
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <p className={`col-span-full font-mono text-sm ${muted}`}>{error}</p>
          ) : projects.length === 0 ? (
            <p className={`col-span-full font-mono text-sm ${muted}`}>No projects to display yet.</p>
          ) : (
            projects.map((project, idx) => {
              const indexLabel = `#${String(idx + 1).padStart(3, '0')}`

              return (
                <div
                  key={project.id}
                  className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1.5 hover:z-10 ${cardHoverGlow} ${cardBorderHover} ${cardBg}`}
                >
                  {/* Image area */}
                  <div className="relative aspect-video overflow-hidden">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center font-mono text-xs ${isMatrix ? 'bg-matrix-dim/20 text-matrix-dim' : 'bg-gray-100 text-gray-400'}`}>
                        no image
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className={`absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t ${gradientEnd} to-transparent`} />

                    {/* Index number - top left */}
                    <span className={`absolute left-3 top-3 font-mono text-xs font-semibold ${indexColor}`}>
                      {indexLabel}
                    </span>
                  </div>

                  {/* Content area */}
                  <div className="flex flex-1 flex-col p-4 pt-0 -mt-4 relative z-10">
                    <h3 className={`mb-1 font-mono text-base font-bold ${titleColor}`}>
                      {project.title}
                    </h3>

                    <p className={`text-xs leading-relaxed ${descColor}`}>
                      {project.description}
                    </p>

                    {/* Tech stack tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.techStack.map((t) => (
                        <span
                          key={t}
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] ${tagBorder} ${tagText} ${tagBg}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-auto pt-4 flex gap-3">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.stopPropagation()
                            trackEvent('project_click', { projectId: project.id, projectTitle: project.title, linkType: 'open' })
                          }}
                          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-mono text-xs font-semibold transition-colors ${openBtnCls}`}
                        >
                          <ExternalLinkIcon className="h-3.5 w-3.5" />
                          OPEN
                        </a>
                      )}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.stopPropagation()
                            trackEvent('project_click', { projectId: project.id, projectTitle: project.title, linkType: 'source' })
                          }}
                          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-mono text-xs transition-colors ${sourceBtnCls}`}
                        >
                          <GitHubIcon className="h-3.5 w-3.5" />
                          SOURCE
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
