import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { GitHubIcon, ExternalLinkIcon } from './icons'

export default function ProjectModal({ project, onClose }) {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const modalRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!project) return
    previouslyFocused.current = document.activeElement

    const node = modalRef.current
    const focusables = node
      ? node.querySelectorAll(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
        )
      : []
    focusables[0]?.focus()

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab' && focusables.length > 0) {
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [project, onClose])

  const frame = isMatrix
    ? 'border-matrix-green/30 bg-bg-void/95'
    : 'border-bluepill-accent/30 bg-white/95'
  const titleBar = isMatrix
    ? 'border-matrix-green/30 bg-matrix-dim/40'
    : 'border-bluepill-accent/30 bg-bluepill-bg'
  const titleText = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const closeBtn = isMatrix
    ? 'border-matrix-green/40 text-matrix-green hover:bg-matrix-green/10'
    : 'border-bluepill-accent/40 text-bluepill-accent-dark hover:bg-bluepill-accent/10'
  const bodyText = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const imgBorder = isMatrix ? 'border-matrix-green/20' : 'border-bluepill-accent/20'
  const tagBg = isMatrix
    ? 'bg-matrix-dim/40 text-matrix-green/80 border-matrix-green/20'
    : 'bg-bluepill-accent/10 text-bluepill-accent-dark border-bluepill-accent/20'
  const linkBtn = isMatrix
    ? 'border-matrix-green/40 text-matrix-green hover:bg-matrix-green/10'
    : 'border-bluepill-accent/40 text-bluepill-accent-dark hover:bg-bluepill-accent/10'

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={project.title}
            className={`relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border font-mono ${frame}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div
              className={`flex items-center gap-2 border-b px-4 py-2.5 ${titleBar}`}
            >
              <span className="h-3 w-3 rounded-full bg-alert" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-green-500" />
              <span className={`ml-2 text-xs ${titleText}`}>
                {project.title.toLowerCase().replace(/\s+/g, '-')}.js
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close project details"
                className={`ml-auto rounded border px-2 py-0.5 text-sm leading-none ${closeBtn}`}
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <img
                src={project.thumbnail}
                alt={project.title}
                className={`mb-4 w-full rounded border object-cover aspect-video ${imgBorder}`}
              />
              <p className={`mb-5 text-sm leading-relaxed ${bodyText}`}>
                {project.description}
              </p>

              <div className="mb-6 flex flex-wrap gap-2">
                {project.techStack.map((t) => (
                  <span
                    key={t}
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${tagBg}`}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm ${linkBtn}`}
                >
                  <GitHubIcon /> GitHub
                </a>
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm ${linkBtn}`}
                >
                  <ExternalLinkIcon /> Live Demo
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
