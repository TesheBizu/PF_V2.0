import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Briefcase, GraduationCap, BookOpen } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import api from '../../lib/api'
import socket from '../../lib/socket'
import TerminalReveal from '../ui/TerminalReveal'

const FALLBACK = [
  {
    _id: 'f1',
    company: 'Nexus Labs',
    role: 'Senior Frontend Engineer',
    startDate: '2022-03-01',
    endDate: null,
    location: 'Addis Ababa, Ethiopia',
    logoUrl: 'https://placehold.co/96x96/0a0e0a/00ff41?text=NL',
    companyUrl: null,
    type: 'Work Experience',
    description: [
      'Led migration of the legacy dashboard to a React + TypeScript SPA.',
      'Built a reusable component library adopted by 4 product teams.',
      'Cut median page load time by 45% via code-splitting and caching.',
    ],
  },
  {
    _id: 'f2',
    company: 'ByteForge',
    role: 'Frontend Developer',
    startDate: '2020-06-01',
    endDate: '2022-02-28',
    location: 'Remote',
    logoUrl: 'https://placehold.co/96x96/0a0e0a/00ff41?text=BF',
    companyUrl: null,
    type: 'Work Experience',
    description: [
      'Developed the customer-facing web app with real-time data views.',
      'Implemented design-system tokens and theming infrastructure.',
      'Mentored two junior developers through regular code reviews.',
    ],
  },
  {
    _id: 'f3',
    company: 'OpenSource Collective',
    role: 'Contributor / Maintainer',
    startDate: '2019-01-01',
    endDate: '2020-05-31',
    location: 'Remote',
    logoUrl: null,
    companyUrl: null,
    type: 'Self-Learning',
    description: [
      'Maintained a popular charting library (2k+ GitHub stars).',
      'Triaged issues and reviewed community pull requests.',
      'Wrote documentation and shipped accessibility fixes.',
    ],
  },
]

function fmtDate(d) {
  if (!d) return null
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function TypeIcon({ type, className }) {
  switch (type) {
    case 'Education':
      return <GraduationCap className={className} />
    case 'Self-Learning':
      return <BookOpen className={className} />
    default:
      return <Briefcase className={className} />
  }
}

const TYPE_PILL_CLS = {
  matrix: {
    'Work Experience': 'border-matrix-green/20 text-matrix-green/60 bg-matrix-green/5',
    'Education': 'border-matrix-green/20 text-matrix-green/60 bg-matrix-green/5',
    'Self-Learning': 'border-matrix-green/20 text-matrix-green/60 bg-matrix-green/5',
  },
  bluepill: {
    'Work Experience': 'border-bluepill-accent/20 text-bluepill-accent/60 bg-bluepill-accent/5',
    'Education': 'border-bluepill-accent/20 text-bluepill-accent/60 bg-bluepill-accent/5',
    'Self-Learning': 'border-bluepill-accent/20 text-bluepill-accent/60 bg-bluepill-accent/5',
  },
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 768px)').matches
      : true,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export default function Experience() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const reduce = useReducedMotion()
  const isDesktop = useIsDesktop()

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/experience')
      .then((res) => {
        if (!cancelled && res.data.length > 0) setEntries(res.data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setEntries((prev) => (prev.length === 0 ? FALLBACK : prev))
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('experience:created', (entry) => {
      setEntries((prev) => {
        if (prev.some((e) => e._id === entry._id)) return prev
        return [...prev, entry]
      })
    })

    socket.on('experience:updated', (entry) => {
      setEntries((prev) =>
        prev.map((e) => (e._id === entry._id ? entry : e)),
      )
    })

    socket.on('experience:deleted', ({ id }) => {
      setEntries((prev) => prev.filter((e) => e._id !== id))
    })

    socket.on('experience:reordered', (list) => {
      setEntries(list)
    })

    return () => {
      socket.off('experience:created')
      socket.off('experience:updated')
      socket.off('experience:deleted')
      socket.off('experience:reordered')
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveId(null)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'
  const lineColor = isMatrix ? 'bg-matrix-green/30' : 'bg-bluepill-accent/30'

  const logoBg = isMatrix ? 'bg-matrix-dim/40' : 'bg-gray-100'
  const logoBorder = isMatrix ? 'border-matrix-green/20' : 'border-gray-200'
  const logoIconColor = isMatrix ? 'text-matrix-green/40' : 'text-gray-400'

  const glowIdle = isMatrix
    ? 'shadow-[0_0_12px_-3px_var(--color-matrix-green)]'
    : 'shadow-[0_0_12px_-3px_var(--color-bluepill-accent)]'
  const glowActive = isMatrix
    ? 'shadow-[0_0_22px_-2px_var(--color-matrix-green)]'
    : 'shadow-[0_0_22px_-2px_var(--color-bluepill-accent)]'
  const glowCurrent = isMatrix
    ? 'shadow-[0_0_16px_-2px_var(--color-matrix-green)]'
    : 'shadow-[0_0_16px_-2px_var(--color-bluepill-accent)]'
  const currentDot = isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'

  const cardBg = isMatrix ? 'bg-bg-void/95' : 'bg-white'
  const cardBorder = isMatrix ? 'border-matrix-green/20' : 'border-gray-200'
  const cardShadow = isMatrix
    ? 'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]'
    : 'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)]'
  const roleText = isMatrix ? 'text-text-primary' : 'text-gray-900'
  const companyText = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const dateLocText = isMatrix ? 'text-matrix-green/40' : 'text-gray-400'
  const bodyText = isMatrix ? 'text-text-primary/70' : 'text-gray-600'
  const bulletChar = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent/50'
  const currentBadge = isMatrix
    ? 'border-matrix-green/50 bg-matrix-green/10 text-matrix-green'
    : 'border-bluepill-accent/50 bg-bluepill-accent/10 text-bluepill-accent-dark'

  if (loading) {
    return (
      <section id="experience" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}>
            <span className={accent}>&gt;</span>{' '}
            <TerminalReveal mode="type" text="cat experience.log" as="span" />
          </h2>
          <p className={`font-mono text-sm ${muted}`}>{'> loading experience...'}</p>
        </div>
      </section>
    )
  }

  return (
    <section id="experience" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span>{' '}
          <TerminalReveal mode="type" text="cat experience.log" as="span" />
        </h2>
        <p className={`mb-14 font-mono text-sm ${muted}`}>
          <span className="opacity-60">$</span> listing career timeline...
        </p>

        <div ref={containerRef} className="relative mx-auto max-w-3xl">
          <span
            className={`absolute left-[23px] top-0 bottom-0 w-px md:left-1/2 md:-translate-x-px ${lineColor}`}
            aria-hidden="true"
          />

          {entries.map((item, index) => {
            const isLeft = index % 2 === 0
            const isCurrent = item.endDate == null
            const isActive = activeId === item._id
            const startStr = fmtDate(item.startDate)
            const endStr = item.endDate ? fmtDate(item.endDate) : 'Present'
            const dateRange = `${startStr} — ${endStr}`
            const dateLocation = item.location
              ? `${dateRange}  •  ${item.location}`
              : dateRange

            function activate() {
              setActiveId((prev) => (prev === item._id ? null : item._id))
            }

            const logoContent = item.logoUrl ? (
              <img
                src={item.logoUrl}
                alt={`${item.company} logo`}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <TypeIcon type={item.type} className={`h-4 w-4 ${logoIconColor}`} />
            )

            return (
              <motion.div
                key={item._id}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 24 }}
                whileInView={reduce ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: index * 0.12, ease: 'easeOut' }}
                className="relative py-12 md:py-16"
              >
                <button
                  type="button"
                  onClick={activate}
                  onMouseEnter={() => {
                    if (isDesktop) setActiveId(item._id)
                  }}
                  onMouseLeave={() => {
                    if (isDesktop) setActiveId(null)
                  }}
                  className={`absolute left-[23px] top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 md:left-1/2 cursor-pointer rounded-full border-2 transition-shadow duration-300 focus:outline-none ${
                    logoBg
                  } ${logoBorder} ${
                    isActive
                      ? glowActive
                      : isCurrent
                        ? glowCurrent
                        : glowIdle
                  }`}
                  aria-label={item.role + ' at ' + item.company}
                >
                  {isCurrent && !reduce && (
                    <span
                      className={`absolute -inset-1.5 animate-ping rounded-full opacity-30 ${currentDot}`}
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex h-12 w-12 items-center justify-center">
                    {logoContent}
                  </span>
                </button>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { opacity: 0, x: isLeft ? 16 : -16 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, x: isLeft ? 12 : -12 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={`absolute top-1/2 z-10 w-72 -translate-y-1/2 pl-14 md:pl-0 ${
                        isLeft
                          ? 'left-[48px] md:left-auto md:right-[calc(50%+36px)]'
                          : 'left-[48px] md:left-[calc(50%+36px)]'
                      }`}
                    >
                      <div
                        className={`rounded-xl border p-4 backdrop-blur-sm ${cardBg} ${cardBorder} ${cardShadow}`}
                      >
                        <h3
                          className={`font-mono text-sm font-bold leading-snug ${roleText}`}
                        >
                          {item.role}
                        </h3>

                        <p className="mt-0.5 mb-2">
                          {item.companyUrl ? (
                            <a
                              href={item.companyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`font-mono text-xs font-semibold transition-opacity hover:opacity-80 ${companyText}`}
                            >
                              {item.company}
                            </a>
                          ) : (
                            <span
                              className={`font-mono text-xs font-semibold ${companyText}`}
                            >
                              {item.company}
                            </span>
                          )}
                        </p>

                        <div className="mb-2.5 flex flex-wrap items-center gap-2">
                          <span
                            className={`font-mono text-[11px] ${dateLocText}`}
                          >
                            {dateLocation}
                          </span>
                          {item.type && (
                            <span
                              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                                TYPE_PILL_CLS[isMatrix ? 'matrix' : 'bluepill'][item.type] || TYPE_PILL_CLS[isMatrix ? 'matrix' : 'bluepill']['Work Experience']
                              }`}
                            >
                              {item.type}
                            </span>
                          )}
                          {isCurrent && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${currentBadge}`}
                            >
                              <span
                                className={`inline-block h-1.5 w-1.5 rounded-full ${currentDot} animate-pulse`}
                              />
                              Current
                            </span>
                          )}
                        </div>

                        <ul
                          className={`space-y-1 text-xs leading-relaxed ${bodyText}`}
                        >
                          {(item.description || []).map((point, i) => (
                            <li key={i} className="flex gap-2">
                              <span
                                className={`mt-px select-none ${bulletChar}`}
                              >
                                &gt;
                              </span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
