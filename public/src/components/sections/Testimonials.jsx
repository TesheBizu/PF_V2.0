import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { LinkedInIcon } from '../ui/icons'
import api from '../../lib/api'
import socket from '../../lib/socket'
import { trackEvent } from '../../lib/analytics'

const FALLBACK = []

const AUTOPLAY_MS = 2000

export default function Testimonials() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const reduce = useReducedMotion()

  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const cardRef = useRef(null)

  const [testimonials, setTestimonials] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)

  const n = testimonials.length
  const useClones = n >= 3

  // Build an infinite-loop array only when there are enough items to justify it;
  // fewer than 3 items renders a simple linear list because cloned ends would
  // be visible in the viewport and create spurious visual duplicates.
  const LOOP = useMemo(() => {
    if (n === 0) return []
    if (!useClones) return testimonials
    return [testimonials[n - 1], ...testimonials, testimonials[0]]
  }, [testimonials, n, useClones])

  const [index, setIndex] = useState(1)
  const [cardW, setCardW] = useState(0)
  const [gap, setGap] = useState(16)
  const [animate, setAnimate] = useState(true)

  const pausedRef = useRef(false)
  const resumeTimer = useRef(null)
  const inView = useInView(sectionRef, { amount: 0.3 })

  const sectionTracked = useRef(false)
  useEffect(() => {
    if (inView && !sectionTracked.current) {
      sectionTracked.current = true
      trackEvent('section_view', { section: 'testimonials' })
    }
  }, [inView])

  // Clamp index when list shrinks or grows
  useEffect(() => {
    if (n === 0) return
    const uc = n >= 3
    setIndex((prev) => {
      if (uc) {
        if (prev < 1) return 1
        if (prev > n) return n
      } else {
        if (prev < 0) return 0
        if (prev > n - 1) return n - 1
      }
      return prev
    })
  }, [n])

  const active = n > 0 ? (useClones ? ((index - 1) % n + n) % n : index) : 0

  // Fetch testimonials
  useEffect(() => {
    setLoading(true)
    api
      .get('/testimonials')
      .then((res) => setTestimonials(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Socket.IO live updates
  useEffect(() => {
    socket.connect()

    socket.on('testimonials:created', (t) => {
      setTestimonials((prev) => {
        if (prev.some((x) => x._id === t._id)) return prev
        return [...prev, t]
      })
    })

    socket.on('testimonials:updated', (t) => {
      setTestimonials((prev) =>
        prev.map((x) => (x._id === t._id ? t : x)),
      )
    })

    socket.on('testimonials:deleted', ({ id }) => {
      setTestimonials((prev) => prev.filter((x) => x._id !== id))
    })

    socket.on('testimonials:reordered', (list) => {
      setTestimonials(list)
    })

    return () => {
      socket.off('testimonials:created')
      socket.off('testimonials:updated')
      socket.off('testimonials:deleted')
      socket.off('testimonials:reordered')
      socket.disconnect()
    }
  }, [])

  // Measure card width + gap
  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current
      const card = cardRef.current
      if (!track || !card) return
      const g =
        parseInt(
          getComputedStyle(track).columnGap ||
            getComputedStyle(track).gap ||
            '16',
          10,
        ) || 16
      setCardW(card.offsetWidth)
      setGap(g)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [testimonials])

  const step = cardW + gap
  const offset = -index * step

  const go = useCallback((dir) => {
    setAnimate(true)
    setIndex((prev) => {
      const uc = n >= 3
      const maxIdx = uc ? n + 1 : n - 1
      const next = prev + dir
      if (next > maxIdx) return maxIdx
      if (next < 0) return 0
      return next
    })
  }, [n])

  const goRef = useRef(go)
  useEffect(() => {
    goRef.current = go
  }, [go])

  // Seamless wrap — only relevant when clones are used (n >= 3)
  useEffect(() => {
    if (n < 3 || n === 0) return
    if (index !== n + 1 && index !== 0) return
    const t = setTimeout(
      () => {
        setAnimate(false)
        setIndex(index === n + 1 ? 1 : n)
      },
      reduce ? 0 : 460,
    )
    return () => clearTimeout(t)
  }, [index, n, reduce])

  const jumpTo = useCallback((i) => {
    setAnimate(true)
    setIndex(useClones ? i + 1 : i)
  }, [useClones])

  // Auto-advance
  useEffect(() => {
    if (reduce || n === 0) return
    const id = setInterval(() => {
      if (pausedRef.current || !inView) return
      goRef.current(1)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [reduce, inView, n])

  const pause = useCallback(() => {
    pausedRef.current = true
  }, [])
  const resumeSoon = useCallback(() => {
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false
    }, 4000)
  }, [])

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

  if (n === 0 && !loading) return null

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="px-6 py-24"
      onMouseEnter={pause}
      onMouseLeave={() => {
        pausedRef.current = false
      }}
    >
      <div className="mx-auto max-w-5xl">
        <h2 className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span> cat testimonials.log
        </h2>
        <p className={`mb-10 font-mono text-sm ${muted}`}>
          <span className="opacity-60">$</span> decrypting peer reviews...
        </p>

        {loading ? (
          <p className={`font-mono text-sm ${muted}`}>{'> loading testimonials...'}</p>
        ) : (
          <div
            className="relative"
            onTouchStart={() => {
              pause()
              resumeSoon()
            }}
            onMouseDown={() => {
              pause()
              resumeSoon()
            }}
            onWheel={() => {
              pause()
              resumeSoon()
            }}
          >
            {/* navigation arrows */}
            <div className="mb-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous testimonial"
                className={`inline-flex h-9 w-9 items-center justify-center rounded border font-mono text-lg leading-none ${arrowBtn}`}
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next testimonial"
                className={`inline-flex h-9 w-9 items-center justify-center rounded border font-mono text-lg leading-none ${arrowBtn}`}
              >
                &gt;
              </button>
            </div>

            {/* viewport */}
            <div className="overflow-hidden">
              <div
                ref={trackRef}
                className="flex flex-nowrap gap-4 will-change-transform"
                style={{
                  transform: `translateX(${offset}px)`,
                  transition: animate && !reduce ? 'transform 450ms ease' : 'none',
                }}
              >
                {LOOP.map((t, idx) => {
                  const fullText = `${t.role}${t.company ? ` @ ${t.company}` : ''}`
                  const photo = t.photoUrl || `https://placehold.co/96x96/0a0e0a/00ff41?text=${encodeURIComponent(t.name.split(' ').map(w => w[0]).join(''))}`
                  return (
                    <article
                      key={`${t._id}-${idx}`}
                      ref={idx === 0 ? cardRef : undefined}
                      className={`flex w-full shrink-0 flex-col rounded-lg border p-6 font-mono backdrop-blur-sm sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] ${cardBox}`}
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
                          src={photo}
                          alt={t.name}
                          className={`h-12 w-12 shrink-0 rounded-full border-2 object-cover ${ring}`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm font-semibold ${nameColor}`}
                            title={t.name}
                          >
                            {t.name}
                          </p>
                          <p
                            className={`truncate text-xs ${roleColor}`}
                            title={fullText}
                          >
                            {fullText}
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
                  )
                })}
              </div>
            </div>

            {/* dot indicators */}
            <div className="mt-5 flex items-center justify-center gap-2">
              {testimonials.map((t, i) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => jumpTo(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  aria-current={active === i ? 'true' : undefined}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    active === i ? `${dotActive} w-6` : `${dotBase} w-2`
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
