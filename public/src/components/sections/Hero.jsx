import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useSettings } from '../../context/SettingsContext'
import useTypewriter from '../../hooks/useTypewriter'
import TerminalWindow from '../ui/TerminalWindow'
import BootCore3D from '../ui/BootCore3D'
import MeshGradientBackground from '../ui/MeshGradientBackground'
import { GitHubIcon, LinkedInIcon, TwitterIcon } from '../ui/icons'

const BOOT_EXIT = { opacity: 0, scale: 0.96 }
const BOOT_TRANSITION = { duration: 0.35, ease: 'easeIn' }
const HERO_ENTER = { opacity: 0, y: 24 }
const HERO_TRANSITION = { duration: 0.45, ease: 'easeOut' }

const SOCIAL_LINK_CONFIG = [
  { key: 'github', label: 'GitHub', Icon: GitHubIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon },
  { key: 'twitter', label: 'Twitter / X', Icon: TwitterIcon },
]

export default function Hero({ lines, isBooting }) {
  const { theme } = useTheme()
  const { settings, loading } = useSettings()
  const isMatrix = theme === 'matrix'
  const isBluepill = theme === 'bluepill'
  const roleTitles = settings?.roles?.length ? settings.roles : ['Developer']
  const { display: roleText } = useTypewriter(roleTitles)
  const shouldReduceMotion = useReducedMotion()

  const [showScroll, setShowScroll] = useState(false)

  useEffect(() => {
    if (isBooting) {
      setShowScroll(false)
      return
    }
    const onScroll = () => {
      setShowScroll(window.scrollY < window.innerHeight * 0.85)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isBooting])

  const scrollColor = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent/50'
  const scrollHover = isMatrix ? 'hover:text-matrix-green' : 'hover:text-bluepill-accent'

  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {isBluepill && !isBooting && <MeshGradientBackground />}

      {/* scroll indicator */}
      <AnimatePresence>
        {showScroll && (
          <motion.button
            key="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: [0, 6, 0] }}
            exit={{ opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { opacity: { duration: 0.4 }, y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } }
            }
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className={`absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer transition-colors ${scrollColor} ${scrollHover}`}
            aria-label="Scroll to about section"
          >
            <span className="font-mono text-xs tracking-wider">&gt; scroll_</span>
            <ChevronDown className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

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
              settings={settings}
              loading={loading}
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

function ResolvedHero({ isMatrix, roleText, shouldReduceMotion, settings, loading }) {
  const base = shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }

  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const textColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const accentColor = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent/50'
  const border = isMatrix ? 'border-matrix-green/30' : 'border-bluepill-accent/30'
  const hoverBg = isMatrix ? 'hover:bg-matrix-green/10' : 'hover:bg-bluepill-accent/10'
  const socialColor = isMatrix
    ? 'text-text-primary/60 hover:text-matrix-green'
    : 'text-bluepill-text/60 hover:text-bluepill-accent'

  const heroName = settings?.name || (loading ? '...' : '')
  const tagline = settings?.tagline || ''
  const photoUrl = settings?.profilePhotoUrl
  const socialLinks = settings?.socialLinks || {}

  return (
    <div className={`flex flex-col-reverse items-center gap-10 ${isMatrix ? '' : 'sm:flex-row sm:items-center sm:gap-14'}`}>
      {/* LEFT: text content */}
      <div className={`relative z-10 flex flex-1 flex-col items-center gap-5 text-center ${isMatrix ? '' : 'sm:items-start sm:text-left'}`}>
        <motion.h1
          className={`font-mono text-4xl font-bold sm:text-6xl ${headingColor}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={base}
        >
          {heroName}
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
          {tagline}
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
          {SOCIAL_LINK_CONFIG.map(({ key, label, Icon }) => {
            const href = socialLinks[key]
            if (!href) return null
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className={`transition-colors ${socialColor}`}
              >
                <Icon />
              </a>
            )
          })}
        </motion.div>
      </div>

      {/* RIGHT: profile photo */}
      {!isMatrix && photoUrl && (
        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...base, delay: shouldReduceMotion ? 0 : 0.15 }}
        >
          <div
            className="w-56 sm:w-64 aspect-[4/5]"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse 80% 75% at 50% 45%, black 50%, transparent 72%)',
              maskImage: 'radial-gradient(ellipse 80% 75% at 50% 45%, black 50%, transparent 72%)',
            }}
          >
            <img
              src={photoUrl}
              alt={settings?.name || 'Profile photo'}
              className="h-full w-full object-cover object-top"
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}
