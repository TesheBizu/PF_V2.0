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
    <div className="flex flex-col-reverse items-center gap-10 sm:flex-row sm:items-center sm:gap-14">
      {/* LEFT: text content */}
      <div className="relative z-10 flex flex-1 flex-col items-center gap-5 text-center sm:items-start sm:text-left">
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
      {(isMatrix || photoUrl) && (
        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...base, delay: shouldReduceMotion ? 0 : 0.15 }}
        >
          {isMatrix ? (
            <div className="relative">
              <div className="absolute -left-[3px] -top-[3px] z-10 h-4 w-4 border-l-[1.5px] border-t-[1.5px] border-matrix-green/70" />
              <div className="absolute -right-[3px] -top-[3px] z-10 h-4 w-4 border-r-[1.5px] border-t-[1.5px] border-matrix-green/70" />
              <div className="absolute -bottom-[3px] -left-[3px] z-10 h-4 w-4 border-b-[1.5px] border-l-[1.5px] border-matrix-green/70" />
              <div className="absolute -bottom-[3px] -right-[3px] z-10 h-4 w-4 border-b-[1.5px] border-r-[1.5px] border-matrix-green/70" />

              <div className="w-56 overflow-hidden sm:w-64 aspect-[4/5] border border-matrix-green/40 shadow-[0_0_12px_rgba(0,255,65,0.25)] bg-matrix-dim/20">
                <div className="relative h-full w-full">
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-matrix-green">
                    <svg viewBox="0 0 200 260" fill="currentColor" className="h-full w-full" opacity={0.85}>
                      <path d="M100 15C55 15 25 50 25 90v12c0 14-5 22-5 38v12c0 10 8 16 16 16v18c0 28 26 48 64 48s64-20 64-48v-18c8 0 16-6 16-16v-12c0-16-5-24-5-38V90c0-40-30-75-75-75z" />
                      <ellipse cx="100" cy="128" rx="34" ry="40" fill="#0a0e0a" opacity={0.95} />
                      <path d="M30 205 20 260h160l-10-55" />
                    </svg>
                  </div>

                  {!shouldReduceMotion && (
                    <>
                      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                        <div className="absolute left-0 right-0 h-px bg-matrix-green/10" style={{ animation: 'scanline 4s linear infinite' }} />
                      </div>
                      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ animation: 'glitch-shift 5s ease-in-out 3s infinite' }} />
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </motion.div>
      )}
    </div>
  )
}
