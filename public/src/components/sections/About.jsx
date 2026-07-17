import { useRef, useState, useEffect } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import TerminalWindow from '../ui/TerminalWindow'
import TerminalReveal from '../ui/TerminalReveal'

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

  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const bioText = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const border = isMatrix ? 'border-matrix-green/30' : 'border-bluepill-accent/30'
  const hoverBg = isMatrix ? 'hover:bg-matrix-green/10' : 'hover:bg-bluepill-accent/10'

  return (
    <section id='about' className='px-6 py-24'>
      <div className='mx-auto max-w-5xl'>
        <h2 className={`mb-12 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span>{' '}
          <TerminalReveal mode='type' text='about' as='span' />
        </h2>

        <div className='flex flex-col gap-10 md:flex-row md:gap-14'>
          {/* LEFT: stats */}
          <div className='grid w-full grid-cols-2 gap-4 sm:w-2/5 md:order-1'>
            {STATS.map((s) => (
              <StatBlock key={s.label} {...s} isMatrix={isMatrix} reduce={reduce} />
            ))}
          </div>

          {/* RIGHT: bio terminal + buttons */}
          <div className='w-full flex-1 md:order-2'>
            <TerminalWindow title='about.txt' className='w-full'>
              <div className={`font-mono text-sm ${accent}`}>
                <span className='opacity-70'>$</span> cat about.txt
              </div>
              <TerminalReveal
                mode='lines'
                lines={BIO}
                lineClassName={`mt-3 font-sans text-sm leading-relaxed ${bioText}`}
              />
            </TerminalWindow>

            <div className='mt-5 flex gap-4'>
              <a
                href='#contact'
                className={`rounded border ${border} px-4 py-2 font-mono text-sm transition-colors ${hoverBg}`}
              >
                &gt; contact_me
              </a>
              <a
                href='/resume.pdf'
                download
                className={`rounded border ${border} px-4 py-2 font-mono text-sm transition-colors ${hoverBg}`}
              >
                &gt; download_cv
              </a>
            </div>
          </div>
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
