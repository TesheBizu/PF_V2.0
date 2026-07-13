import { useTheme } from '../../context/ThemeContext'
import { motion, useReducedMotion } from 'framer-motion'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isMatrix = theme === 'matrix'
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="flex flex-col items-end gap-2">
      <span className="text-xs font-mono text-matrix-green/60 select-none">
        &gt; choose your reality
      </span>

      <div className="flex items-center gap-3">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-alert shadow-[0_0_8px_#ff2e2e]" />

        <button
          type="button"
          role="switch"
          aria-checked={isMatrix}
          aria-label={`Current theme: ${theme}. Toggle to ${isMatrix ? 'bluepill' : 'matrix'} theme.`}
          onClick={toggleTheme}
          className={`relative h-8 w-20 rounded-full border border-matrix-green/30 bg-bg-void p-1 hover:border-matrix-green/50 focus:outline-none focus:ring-2 focus:ring-matrix-green/50 focus:ring-offset-2 focus:ring-offset-bg-void ${
            shouldReduceMotion ? '' : 'transition-colors duration-200'
          }`}
        >
          <motion.span
            className="absolute top-1 left-1 block h-6 w-8 rounded-full"
            animate={{ x: isMatrix ? 0 : 40 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 500, damping: 30 }
            }
            style={{ background: isMatrix ? '#ff2e2e' : '#2563eb' }}
          />
        </button>

        <span className="inline-block h-2.5 w-2.5 rounded-full bg-bluepill-accent shadow-[0_0_8px_#2563eb]" />
      </div>
    </div>
  )
}
