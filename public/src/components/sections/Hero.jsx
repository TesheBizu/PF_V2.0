import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import useTypewriter from '../../hooks/useTypewriter'
import TerminalWindow from '../ui/TerminalWindow'
import BootCore3D from '../ui/BootCore3D'
import { GitHubIcon, LinkedInIcon, TwitterIcon } from '../ui/icons'

const ROLE_TITLES = [
  'Full Stack Developer',
  'MERN Developer',
  'Problem Solver',
]

const TAGLINE =
  'Building digital experiences with clean code and creative thinking'

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/example', Icon: GitHubIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/example', Icon: LinkedInIcon },
  { label: 'Twitter / X', href: 'https://x.com/example', Icon: TwitterIcon },
]

const BOOT_EXIT = { opacity: 0, scale: 0.96 }
const BOOT_TRANSITION = { duration: 0.35, ease: 'easeIn' }
const HERO_ENTER = { opacity: 0, y: 24 }
const HERO_TRANSITION = { duration: 0.45, ease: 'easeOut' }

export default function Hero({ lines, isBooting }) {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const { display: roleText } = useTypewriter(ROLE_TITLES)
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="home" className="flex min-h-screen items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {isBooting ? (
          <motion.div
            key="boot"
            exit={shouldReduceMotion ? { opacity: 0 } : BOOT_EXIT}
            transition={shouldReduceMotion ? { duration: 0 } : BOOT_TRANSITION}
          >
            <BootScreen lines={lines} isMatrix={isMatrix} />
          </motion.div>
        ) : (
          <motion.div
            key="hero"
            initial={shouldReduceMotion ? { opacity: 1 } : HERO_ENTER}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : HERO_TRANSITION}
            className="w-full max-w-5xl"
          >
            <ResolvedHero
              isMatrix={isMatrix}
              roleText={roleText}
              shouldReduceMotion={shouldReduceMotion}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function BootScreen({ lines, isMatrix }) {
  const promptColor = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent/50'
  const lineColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const hintColor = isMatrix ? 'text-text-primary/40' : 'text-bluepill-text/40'

  return (
    <div className="flex flex-col items-center gap-6">
      <BootCore3D bootLineCount={lines.length} />
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
    </div>
  )
}

function ResolvedHero({ isMatrix, roleText, shouldReduceMotion }) {
  const base = shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }

  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const textColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const accentColor = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent/50'
  const border = isMatrix ? 'border-matrix-green/30' : 'border-bluepill-accent/30'
  const hoverBg = isMatrix ? 'hover:bg-matrix-green/10' : 'hover:bg-bluepill-accent/10'
  const socialColor = isMatrix
    ? 'text-text-primary/60 hover:text-matrix-green'
    : 'text-bluepill-text/60 hover:text-bluepill-accent'

  const bracket = isMatrix ? 'border-matrix-green' : 'border-bluepill-accent'
  const photoBorder = isMatrix ? 'border-matrix-green/60' : 'border-bluepill-accent/60'
  const glow = isMatrix
    ? 'hover:shadow-[0_0_20px_var(--color-matrix-green)]'
    : 'hover:shadow-[0_0_20px_var(--color-bluepill-accent)]'
  const initialsColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const avatarBg = isMatrix ? 'bg-matrix-dim/30' : 'bg-bluepill-bg/40'

  return (
    <div className="flex flex-col-reverse items-center gap-10 sm:flex-row sm:items-center sm:gap-14">
      {/* LEFT: text content */}
      <div className="flex flex-1 flex-col items-center gap-5 text-center sm:items-start sm:text-left">
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
          <span className="ml-0.5 animate-pulse">_</span>
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
            &gt; get_in_touch
          </a>
        </motion.div>

        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...base, delay: shouldReduceMotion ? 0 : 0.7 }}
        >
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className={`transition-colors ${socialColor}`}
            >
              <Icon />
            </a>
          ))}
        </motion.div>
      </div>

      {/* RIGHT: profile photo */}
      <motion.div
        className="group relative shrink-0"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...base, delay: shouldReduceMotion ? 0 : 0.15 }}
      >
        <span className={`absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 ${bracket}`} />
        <span className={`absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 ${bracket}`} />
        <span className={`absolute left-0 bottom-0 h-5 w-5 border-l-2 border-b-2 ${bracket}`} />
        <span className={`absolute right-0 bottom-0 h-5 w-5 border-r-2 border-b-2 ${bracket}`} />

        <div
          className={`relative h-56 w-56 overflow-hidden border-2 transition-shadow duration-300 sm:h-64 sm:w-64 ${photoBorder} ${glow}`}
        >
          <div
            className={`flex h-full w-full items-center justify-center font-data text-6xl font-bold ${initialsColor} ${avatarBg}`}
          >
            JD
          </div>
        </div>
      </motion.div>
    </div>
  )
}
