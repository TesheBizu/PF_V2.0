import { useRef, useState, useEffect } from 'react'
import { motion, useInView, useReducedMotion, animate } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import TerminalWindow from '../ui/TerminalWindow'

const BIO = [
  'I am a full-stack developer who builds fast, accessible web applications with the MERN stack.',
  'I care about clean architecture, thoughtful UX, and shipping things that hold up in production.',
  'Currently open to freelance work and collaboration - reach out if you want to build something together.',
]

const STATS = [
  { value: 5, label: 'Years Experience', suffix: '+' },
  { value: 24, label: 'Projects Completed' },
  { value: 18, label: 'Technologies' },
  { value: 100, label: 'Coffee Consumed', suffix: '%' },
]

export default function About() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const reduce = useReducedMotion()

  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.2 })

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.35, delayChildren: reduce ? 0 : 0.2 } },
  }
  const lineVariant = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.4 } },
  }

  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const bioText = isMatrix ? 'text-text-primary' : 'text-bluepill-text'

  // Avatar / photo-frame styling (CSS-only glitch + scanlines)
  const bracket = isMatrix ? 'border-matrix-green' : 'border-bluepill-accent'
  const photoBorder = isMatrix ? 'border-matrix-green/60' : 'border-bluepill-accent/60'
  const glow = isMatrix
    ? 'group-hover:shadow-[0_0_20px_var(--color-matrix-green)]'
    : 'group-hover:shadow-[0_0_20px_var(--color-bluepill-accent)]'
  const glitch = 'group-hover:[animation:glitch-shift_0.4s_steps(2,end)_infinite]'
  const initialsColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const avatarBg = isMatrix ? 'bg-matrix-dim/30' : 'bg-bluepill-bg/40'
  const rgbSplit =
    'group-hover:[text-shadow:2px_0_var(--color-alert),-2px_0_var(--color-bluepill-accent)]'
  const scanClass = isMatrix
    ? 'bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,var(--color-matrix-green)_3px,var(--color-matrix-green)_4px)]'
    : 'bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,var(--color-bluepill-accent)_3px,var(--color-bluepill-accent)_4px)]'
  const sweep = isMatrix
    ? 'bg-[linear-gradient(to_bottom,transparent,var(--color-matrix-green),transparent)]'
    : 'bg-[linear-gradient(to_bottom,transparent,var(--color-bluepill-accent),transparent)]'

  return (
    <section ref={sectionRef} id='about' className='px-6 py-24'>
      <div className='mx-auto max-w-5xl'>
        <h2 className={`mb-12 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span> about
        </h2>

        <div className='flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-14'>
          {/* Image / avatar */}
          <div className='group relative w-56 shrink-0 sm:w-64'>
            <span className={`absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 ${bracket}`} />
            <span className={`absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 ${bracket}`} />
            <span className={`absolute left-0 bottom-0 h-5 w-5 border-l-2 border-b-2 ${bracket}`} />
            <span className={`absolute right-0 bottom-0 h-5 w-5 border-r-2 border-b-2 ${bracket}`} />

            <div
              className={`relative h-56 w-56 overflow-hidden border-2 transition-shadow duration-300 sm:h-64 sm:w-64 ${photoBorder} ${glow} ${glitch}`}
            >
              <div
                className={`flex h-full w-full items-center justify-center font-data text-6xl font-bold ${initialsColor} ${avatarBg} ${rgbSplit}`}
              >
                JD
              </div>
              <div className={`pointer-events-none absolute inset-0 opacity-30 ${scanClass}`} />
              <div className='pointer-events-none absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100'>
                <div
                  className={`absolute inset-x-0 top-0 h-1/4 opacity-50 [animation:scanline_2.5s_linear_infinite] ${sweep}`}
                />
              </div>
            </div>
          </div>

          {/* Bio terminal */}
          <div className='w-full flex-1'>
            <TerminalWindow title='about.txt' className='w-full'>
              <motion.div
                variants={container}
                initial='hidden'
                animate={inView ? 'show' : 'hidden'}
              >
                <motion.div variants={lineVariant} className={`font-mono text-sm ${accent}`}>
                  <span className='opacity-70'>$</span> cat about.txt
                </motion.div>
                {BIO.map((para, i) => (
                  <motion.p
                    key={i}
                    variants={lineVariant}
                    className={`mt-3 font-sans text-sm leading-relaxed ${bioText}`}
                  >
                    {para}
                  </motion.p>
                ))}
              </motion.div>
            </TerminalWindow>
          </div>
        </div>

        {/* Stats */}
        <div className='mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4'>
          {STATS.map((s) => (
            <StatBlock key={s.label} {...s} isMatrix={isMatrix} reduce={reduce} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatBlock({ value, label, suffix = '', isMatrix, reduce }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, value, reduce])

  const numColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const labelColor = isMatrix ? 'text-text-primary/60' : 'text-bluepill-text/60'
  const boxBg = isMatrix ? 'border-matrix-green/20 bg-bg-void/50' : 'border-bluepill-accent/20 bg-bluepill-bg/60'

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center rounded-md border px-3 py-5 font-mono ${boxBg}`}
    >
      <span className={`font-data text-3xl font-bold sm:text-4xl ${numColor}`}>
        {display}
        {suffix}
      </span>
      <span className={`mt-1 text-center text-xs ${labelColor}`}>{label}</span>
    </div>
  )
}
