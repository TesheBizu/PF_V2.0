import { useCallback, useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import api from '../../lib/api'
import TerminalWindow from '../ui/TerminalWindow'
import ProjectModal from '../ui/ProjectModal'
import TerminalReveal from '../ui/TerminalReveal'
import { GitHubIcon, ExternalLinkIcon } from '../ui/icons'

export default function Projects() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const [selected, setSelected] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get('/projects')
      .then((res) => {
        if (!cancelled) {
          setProjects(
            res.data.map((p) => ({
              id: p._id,
              title: p.title,
              description: p.description,
              techStack: p.techStack,
              thumbnail: p.thumbnailUrl,
              githubUrl: p.githubUrl,
              liveUrl: p.liveUrl,
              featured: p.featured,
            })),
          )
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load projects.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const closeModal = useCallback(() => setSelected(null), [])

  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'

  const glow = isMatrix
    ? 'hover:shadow-[0_0_22px_-4px_var(--color-matrix-green)]'
    : 'hover:shadow-[0_0_22px_-4px_var(--color-bluepill-accent)]'

  const cardBody = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const imgBorder = isMatrix ? 'border-matrix-green/20' : 'border-bluepill-accent/20'
  const tagBg = isMatrix
    ? 'bg-matrix-dim/40 text-matrix-green/80 border-matrix-green/20'
    : 'bg-bluepill-accent/10 text-bluepill-accent-dark border-bluepill-accent/20'
  const badgeBg = isMatrix
    ? 'bg-matrix-green/15 text-matrix-green border-matrix-green/40'
    : 'bg-bluepill-accent/15 text-bluepill-accent-dark border-bluepill-accent/40'
  const iconBtn = isMatrix
    ? 'border-matrix-green/40 text-matrix-green hover:bg-matrix-green/10'
    : 'border-bluepill-accent/40 text-bluepill-accent-dark hover:bg-bluepill-accent/10'

  return (
    <section id="projects" className="px-6 py-24">
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
              <div key={i} className="animate-pulse">
                <TerminalWindow title="loading.js">
                  <div className={`mb-3 aspect-video rounded ${isMatrix ? 'bg-matrix-dim/20' : 'bg-gray-200'}`} />
                  <div className={`mb-2 h-4 w-3/4 rounded ${isMatrix ? 'bg-matrix-dim/20' : 'bg-gray-200'}`} />
                  <div className={`h-3 w-full rounded ${isMatrix ? 'bg-matrix-dim/20' : 'bg-gray-200'}`} />
                </TerminalWindow>
              </div>
            ))
          ) : error ? (
            <p className={`col-span-full font-mono text-sm ${muted}`}>{error}</p>
          ) : projects.length === 0 ? (
            <p className={`col-span-full font-mono text-sm ${muted}`}>No projects to display yet.</p>
          ) : (
            projects.map((project) => {
            const filename = `${project.title
              .toLowerCase()
              .replace(/\s+/g, '-')}.js`

            const open = () => setSelected(project)
            const onKeyDown = (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                open()
              }
            }

            return (
              <div key={project.id} className="group relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={open}
                  onKeyDown={onKeyDown}
                  className={`cursor-pointer rounded-lg transition duration-300 hover:scale-[1.03] ${glow}`}
                >
                  <TerminalWindow title={filename} interactive className="h-full">
                    <div className="relative">
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className={`mb-3 w-full rounded border object-cover aspect-video ${imgBorder}`}
                      />
                      {project.featured && (
                        <span
                          className={`absolute left-2 top-2 rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide ${badgeBg}`}
                        >
                          featured
                        </span>
                      )}

                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {project.techStack.map((t) => (
                          <span
                            key={t}
                            className={`rounded-full border px-2 py-0.5 text-[11px] ${tagBg}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <TerminalReveal
                        mode="lines"
                        as="div"
                        lines={[project.description]}
                        lineClassName={`line-clamp-3 text-xs leading-relaxed ${cardBody}`}
                      />
                    </div>
                  </TerminalWindow>
                </div>

                <div className="pointer-events-none absolute right-3 top-3 z-20 flex gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${project.title} GitHub repository`}
                    className={`pointer-events-auto inline-flex rounded border p-1.5 ${iconBtn}`}
                  >
                    <GitHubIcon />
                  </a>
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${project.title} live demo`}
                    className={`pointer-events-auto inline-flex rounded border p-1.5 ${iconBtn}`}
                  >
                    <ExternalLinkIcon />
                  </a>
                </div>
              </div>
            )
          })
        )}
        </div>
      </div>

      <ProjectModal project={selected} onClose={closeModal} />
    </section>
  )
}
