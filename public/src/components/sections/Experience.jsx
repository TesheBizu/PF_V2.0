import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const EXPERIENCE = [
  {
    id: 1,
    company: 'Nexus Labs',
    role: 'Senior Frontend Engineer',
    startDate: 'Mar 2022',
    endDate: null,
    commit: 'a3f9c2d',
    companyLogo: 'https://placehold.co/64x64/0a0e0a/00ff41?text=NL',
    description: [
      'Led migration of the legacy dashboard to a React + TypeScript SPA.',
      'Built a reusable component library adopted by 4 product teams.',
      'Cut median page load time by 45% via code-splitting and caching.',
    ],
  },
  {
    id: 2,
    company: 'ByteForge',
    role: 'Frontend Developer',
    startDate: 'Jun 2020',
    endDate: 'Feb 2022',
    commit: '7b1e04a',
    companyLogo: 'https://placehold.co/64x64/0a0e0a/00ff41?text=BF',
    description: [
      'Developed the customer-facing web app with real-time data views.',
      'Implemented design-system tokens and theming infrastructure.',
      'Mentored two junior developers through regular code reviews.',
    ],
  },
  {
    id: 3,
    company: 'OpenSource Collective',
    role: 'Contributor / Maintainer',
    startDate: 'Jan 2019',
    endDate: 'May 2020',
    commit: 'c4d8f10',
    companyLogo: 'https://placehold.co/64x64/0a0e0a/00ff41?text=OSC',
    description: [
      'Maintained a popular charting library (2k+ GitHub stars).',
      'Triaged issues and reviewed community pull requests.',
      'Wrote documentation and shipped accessibility fixes.',
    ],
  },
]

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

  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'

  const lineColor = isMatrix ? 'bg-matrix-green/30' : 'bg-bluepill-accent/30'
  const dotColor = isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'
  const dotPing = isMatrix ? 'bg-matrix-green/70' : 'bg-bluepill-accent/70'
  const dotGlow = isMatrix
    ? 'shadow-[0_0_10px_var(--color-matrix-green)]'
    : 'shadow-[0_0_10px_var(--color-bluepill-accent)]'

  const cardBox = isMatrix
    ? 'border-matrix-green/20 bg-bg-void/70'
    : 'border-bluepill-accent/20 bg-white/70'
  const hashText = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent-dark'
  const msgText = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const dateText = isMatrix ? 'text-matrix-green/40' : 'text-bluepill-text/50'
  const bodyText = isMatrix ? 'text-text-primary/80' : 'text-bluepill-text/80'
  const headBadge = isMatrix
    ? 'border-matrix-green/50 bg-matrix-green/10 text-matrix-green'
    : 'border-bluepill-accent/50 bg-bluepill-accent/10 text-bluepill-accent-dark'

  return (
    <section id="experience" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span> git log --experience
        </h2>
        <p className={`mb-14 font-mono text-sm ${muted}`}>
          <span className="opacity-60">$</span> showing commit history...
        </p>

        <div className="relative">
          {/* center (desktop) / left (mobile) vertical line */}
          <span
            className={`absolute left-4 top-2 bottom-2 w-px -translate-x-1/2 md:left-1/2 ${lineColor}`}
            aria-hidden="true"
          />

          <div className="md:grid md:grid-cols-2 md:gap-0">
            {EXPERIENCE.map((item, index) => {
              const isLeft = index % 2 === 0
              const isCurrent = item.endDate == null
              const dateRange = `${item.startDate} - ${
                item.endDate ?? 'Present'
              }`

              const initial = reduce
                ? { opacity: 1 }
                : isDesktop
                  ? { opacity: 0, x: isLeft ? -50 : 50 }
                  : { opacity: 0, y: 40 }
              const whileInView = reduce
                ? {}
                : { opacity: 1, x: 0, y: 0 }

              return (
                <motion.div
                  key={item.id}
                  initial={initial}
                  whileInView={whileInView}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`relative mb-12 pl-12 md:pl-0 ${
                    isLeft ? 'md:pr-14' : 'md:col-start-2 md:pl-14'
                  }`}
                >
                  {/* commit dot on the line */}
                  <span className="absolute left-4 top-3 -translate-x-1/2 md:left-1/2">
                    {isCurrent && (
                      <span
                        className={`absolute inline-flex h-3 w-3 animate-ping rounded-full ${dotPing}`}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`relative inline-flex h-3 w-3 rounded-full ${dotColor} ${
                        isCurrent ? dotGlow : ''
                      }`}
                    />
                  </span>

                  {/* entry card */}
                  <div
                    className={`rounded-lg border p-5 font-mono backdrop-blur-sm ${cardBox}`}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className={hashText}>{item.commit}</span>
                      {isCurrent && (
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${headBadge}`}
                        >
                          HEAD
                        </span>
                      )}
                    </div>

                    <p className={`text-sm font-semibold ${msgText}`}>
                      feat: {item.role} @ {item.company}
                    </p>
                    <p className={`mb-3 mt-0.5 text-xs ${dateText}`}>
                      {dateRange}
                    </p>

                    <ul className={`space-y-1 text-xs leading-relaxed ${bodyText}`}>
                      {item.description.map((point, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="select-none opacity-60">-</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
