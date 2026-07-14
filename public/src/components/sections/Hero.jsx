import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import useBootSequence from '../../hooks/useBootSequence'
import useTypewriter from '../../hooks/useTypewriter'
import TerminalWindow from '../ui/TerminalWindow'

const ROLE_TITLES = [
  'Full Stack Developer',
  'MERN Developer',
  'Problem Solver',
]

const TAGLINE =
  'Building digital experiences with clean code and creative thinking'

export default function Hero() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const { lines, isBooting, skipBoot } = useBootSequence()
  const { display: roleText } = useTypewriter(ROLE_TITLES)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isBooting) return

    const skip = () => skipBoot()

    window.addEventListener('keydown', skip)
    window.addEventListener('click', skip)

    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('click', skip)
    }
  }, [isBooting, skipBoot])

  return (
    <section id="home" className="flex min-h-screen items-center justify-center px-6">
      {isBooting ? (
        <BootScreen lines={lines} isMatrix={isMatrix} />
      ) : (
        <ResolvedHero
          isMatrix={isMatrix}
          roleText={roleText}
          shouldReduceMotion={shouldReduceMotion}
        />
      )}
    </section>
  )
}

function BootScreen({ lines, isMatrix }) {
  const promptColor = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent/50'
  const lineColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const hintColor = isMatrix ? 'text-text-primary/40' : 'text-bluepill-text/40'

  return (
    <TerminalWindow title="boot_sequence" className="w-full max-w-2xl">
      <div className="space-y-1">
        {lines.map((line, i) => (
          <div key={i} className={`font-mono text-sm ${lineColor}`}>
            <span className={promptColor}>$</span> {line}
          </div>
        ))}
        <div className={`mt-4 animate-pulse font-xs font-mono ${hintColor}`}>
          Press any key or click to skip...
        </div>
      </div>
    </TerminalWindow>
  )
}

function ResolvedHero({ isMatrix, roleText, shouldReduceMotion }) {
  const base = shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }

  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const textColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const accentColor = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent/50'
  const border = isMatrix ? 'border-matrix-green/30' : 'border-bluepill-accent/30'
  const hoverBg = isMatrix ? 'hover:bg-matrix-green/10' : 'hover:bg-bluepill-accent/10'

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <motion.h1
        className={`font-mono text-4xl font-bold sm:text-6xl ${headingColor}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={base}
      >
        John Doe
      </motion.h1>

      <motion.div
        className={`font-mono text-xl sm:text-2xl ${textColor}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...base, delay: shouldReduceMotion ? 0 : 0.2 }}
      >
        <span className={accentColor}>&gt;</span> {roleText}
        <span className="ml-0.5 animate-pulse">|</span>
      </motion.div>

      <motion.p
        className={`max-w-md font-sans text-sm ${textColor}/60`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...base, delay: shouldReduceMotion ? 0 : 0.4 }}
      >
        {TAGLINE}
      </motion.p>

      <motion.div
        className="flex gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...base, delay: shouldReduceMotion ? 0 : 0.6 }}
      >
        <a
          href="#projects"
          className={`rounded border ${border} px-4 py-2 font-mono text-sm transition-colors ${hoverBg}`}
        >
          &gt; view_projects
        </a>
        <a
          href="#contact"
          className={`rounded border ${border} px-4 py-2 font-mono text-sm transition-colors ${hoverBg}`}
        >
          &gt; contact_me
        </a>
      </motion.div>
    </div>
  )
}
