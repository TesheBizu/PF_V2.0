import { useCallback, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import TerminalWindow from '../ui/TerminalWindow'
import ProjectModal from '../ui/ProjectModal'
import { GitHubIcon, ExternalLinkIcon } from '../ui/icons'

const PROJECTS = [
  {
    id: 1,
    title: 'Neon Dashboard',
    description:
      'A real-time analytics dashboard with websocket streaming, interactive charts, and a fully themeable UI. Handles thousands of live events per second with smooth virtualized lists and a command-palette for power users.',
    techStack: ['React', 'TypeScript', 'WebSocket', 'D3', 'Tailwind'],
    thumbnail: 'https://placehold.co/640x360/0a0e0a/00ff41?text=Neon+Dashboard',
    githubUrl: 'https://github.com/example/neon-dashboard',
    liveUrl: 'https://neon-dashboard.example.com',
    featured: true,
  },
  {
    id: 2,
    title: 'CRUD API Service',
    description:
      'A production-grade REST API with JWT auth, rate limiting, and role-based access control. Includes OpenAPI docs, request validation, and a comprehensive test suite.',
    techStack: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Jest'],
    thumbnail: 'https://placehold.co/640x360/0a0e0a/00ff41?text=CRUD+API',
    githubUrl: 'https://github.com/example/crud-api',
    liveUrl: 'https://crud-api.example.com',
    featured: false,
  },
  {
    id: 3,
    title: 'Portfolio OS',
    description:
      'A terminal-inspired portfolio site with a boot sequence, matrix rain background, and theme switching between a dark "redpill" and light "bluepill" mode.',
    techStack: ['React', 'Vite', 'Framer Motion', 'Tailwind'],
    thumbnail: 'https://placehold.co/640x360/0a0e0a/00ff41?text=Portfolio+OS',
    githubUrl: 'https://github.com/example/portfolio-os',
    liveUrl: 'https://portfolio-os.example.com',
    featured: true,
  },
  {
    id: 4,
    title: 'Image Optimizer',
    description:
      'A CLI and microservice that converts and compresses images in bulk with smart cropping. Exposes a queue-based worker pool and an S3-compatible storage backend.',
    techStack: ['Python', 'FastAPI', 'Redis', 'Docker'],
    thumbnail: 'https://placehold.co/640x360/0a0e0a/00ff41?text=Image+Optimizer',
    githubUrl: 'https://github.com/example/image-optimizer',
    liveUrl: 'https://image-optimizer.example.com',
    featured: false,
  },
  {
    id: 5,
    title: 'Chat Relay',
    description:
      'A low-latency chat application using server-sent events and optimistic UI updates, with presence indicators and markdown message rendering.',
    techStack: ['Next.js', 'GraphQL', 'PostgreSQL', 'Redis'],
    thumbnail: 'https://placehold.co/640x360/0a0e0a/00ff41?text=Chat+Relay',
    githubUrl: 'https://github.com/example/chat-relay',
    liveUrl: 'https://chat-relay.example.com',
    featured: false,
  },
]

export default function Projects() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const [selected, setSelected] = useState(null)

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
          <span className={accent}>&gt;</span> ls projects/
        </h2>
        <p className={`mb-12 font-mono text-sm ${muted}`}>
          <span className="opacity-60">$</span> listing repositories...
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project) => {
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

                      <p
                        className={`line-clamp-3 text-xs leading-relaxed ${cardBody}`}
                      >
                        {project.description}
                      </p>
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
          })}
        </div>
      </div>

      <ProjectModal project={selected} onClose={closeModal} />
    </section>
  )
}
