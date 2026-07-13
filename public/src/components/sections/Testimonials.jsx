import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { LinkedInIcon } from '../ui/icons'

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Mara Voss',
    role: 'Engineering Manager',
    company: 'Nexus Labs',
    quote:
      'One of the most reliable frontend engineers I have worked with. Ships fast, communicates clearly, and cares about the details most people miss.',
    photo: 'https://placehold.co/96x96/0a0e0a/00ff41?text=MV',
    linkedinUrl: 'https://linkedin.com/in/example-mara',
  },
  {
    id: 2,
    name: 'Devin Park',
    role: 'Product Lead',
    company: 'ByteForge',
    quote:
      'Turned a messy backlog into a polished product. Our design system and theming work is basically their brainchild.',
    photo: 'https://placehold.co/96x96/0a0e0a/00ff41?text=DP',
    linkedinUrl: 'https://linkedin.com/in/example-devin',
  },
  {
    id: 3,
    name: 'Aiko Tanaka',
    role: 'CTO',
    company: 'OpenSource Collective',
    quote:
      'A thoughtful open-source contributor. Reviews are sharp, docs are great, and the community trusts their judgment.',
    photo: 'https://placehold.co/96x96/0a0e0a/00ff41?text=AT',
    linkedinUrl: null,
  },
  {
    id: 4,
    name: 'Leo Marsh',
    role: 'Founder',
    company: 'Indie Startup',
    quote:
      'Hired them for a two-week sprint and we shipped a month of work. Genuinely one of the best hires I have made.',
    photo: 'https://placehold.co/96x96/0a0e0a/00ff41?text=LM',
    linkedinUrl: 'https://linkedin.com/in/example-leo',
  },
  {
    id: 5,
    name: 'Sofia Reyes',
    role: 'Design Director',
    company: "Studio P'er",
    quote:
      'Rare to find an engineer who gets visual hierarchy instinctively. Our collaboration made the whole product feel intentional.',
    photo: 'https://placehold.co/96x96/0a0e0a/00ff41?text=SR',
    linkedinUrl: null,
  },
]

export default function Testimonials() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const reduce = useReducedMotion()

  const trackRef = useRef(null)
  const cardRef = useRef(null)
  const [active, setActive] = useState(0)

  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'

  const cardBox = isMatrix
    ? 'border-matrix-green/20 bg-bg-void/70'
    : 'border-bluepill-accent/20 bg-white/70'
  const ring = isMatrix ? 'border-matrix-green/60' : 'border-bluepill-accent/60'
  const nameColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const roleColor = isMatrix ? 'text-matrix-green/70' : 'text-bluepill-accent-dark'
  const quoteColor = isMatrix ? 'text-text-primary/80' : 'text-bluepill-text/80'
  const markColor = isMatrix ? 'text-matrix-green/30' : 'text-bluepill-accent/30'
  const arrowBtn = isMatrix
    ? 'border-matrix-green/40 text-matrix-green hover:bg-matrix-green/10'
    : 'border-bluepill-accent/40 text-bluepill-accent-dark hover:bg-bluepill-accent/10'
  const dotBase = isMatrix
    ? 'bg-matrix-green/30 hover:bg-matrix-green/60'
    : 'bg-bluepill-accent/30 hover:bg-bluepill-accent/60'
  const dotActive = isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'
  const linkBtn = isMatrix
    ? 'text-matrix-green/70 hover:text-matrix-green'
    : 'text-bluepill-accent-dark/70 hover:text-bluepill-accent-dark'

  const step = () => {
    const track = trackRef.current
    const card = cardRef.current
    if (!track || !card) return 320
    const gap = parseInt(getComputedStyle(track).columnGap || '16', 10) || 16
    return card.offsetWidth + gap
  }

  const scrollToIndex = (i) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(i, TESTIMONIALS.length - 1))
    track.scrollTo({ left: clamped * step(), behavior: 'smooth' })
    setActive(clamped)
  }

  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const s = step()
    if (s <= 0) return
    setActive(Math.round(track.scrollLeft / s))
  }

  const atStart = active <= 0
  const atEnd = active >= TESTIMONIALS.length - 1

  return (
    <section id="testimonials" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span> cat testimonials.log
        </h2>
        <p className={`mb-10 font-mono text-sm ${muted}`}>
          <span className="opacity-60">$</span> decrypting peer reviews...
        </p>

        <div className="relative">
          {/* navigation arrows */}
          <div className="mb-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => scrollToIndex(active - 1)}
              disabled={atStart}
              aria-label="Previous testimonial"
              className={`inline-flex h-9 w-9 items-center justify-center rounded border font-mono text-lg leading-none disabled:opacity-30 ${arrowBtn}`}
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(active + 1)}
              disabled={atEnd}
              aria-label="Next testimonial"
              className={`inline-flex h-9 w-9 items-center justify-center rounded border font-mono text-lg leading-none disabled:opacity-30 ${arrowBtn}`}
            >
              &gt;
            </button>
          </div>

          <div
            ref={trackRef}
            onScroll={onScroll}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {TESTIMONIALS.map((t) => (
              <article
                key={t.id}
                ref={TESTIMONIALS[0].id === t.id ? cardRef : undefined}
                className={`flex w-[85%] shrink-0 snap-start flex-col rounded-lg border p-6 font-mono backdrop-blur-sm sm:w-[60%] lg:w-[33.333%] ${cardBox}`}
              >
                <span
                  className={`mb-3 block text-4xl leading-none ${markColor}`}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                <motion.blockquote
                  initial={reduce ? { opacity: 1 } : { opacity: 0, filter: 'blur(6px)' }}
                  whileInView={reduce ? {} : { opacity: 1, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`flex-1 text-sm leading-relaxed ${quoteColor}`}
                >
                  {t.quote}
                </motion.blockquote>

                <div className="mt-5 flex items-center gap-3">
                  <img
                    src={t.photo}
                    alt={t.name}
                    className={`h-12 w-12 shrink-0 rounded-full border-2 object-cover ${ring}`}
                  />
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${nameColor}`}>
                      {t.name}
                    </p>
                    <p className={`truncate text-xs ${roleColor}`}>
                      {t.role}
                      {t.company ? ` @ ${t.company}` : ''}
                    </p>
                  </div>
                  {t.linkedinUrl && (
                    <a
                      href={t.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${t.name} on LinkedIn`}
                      className={`ml-auto inline-flex rounded p-1.5 ${linkBtn}`}
                    >
                      <LinkedInIcon />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* dot / line indicators */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={active === i ? 'true' : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  active === i ? `${dotActive} w-6` : `${dotBase} w-2`
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
