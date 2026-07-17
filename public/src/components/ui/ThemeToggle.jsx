import { useTheme } from '../../context/ThemeContext'
import { motion, useReducedMotion } from 'framer-motion'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isMatrix = theme === 'matrix'
  const shouldReduceMotion = useReducedMotion()

  const borderCls = isMatrix ? 'border-matrix-green/40' : 'border-bluepill-accent/40'
  const matrixLabelCls = isMatrix ? 'text-matrix-green font-bold' : 'text-text-primary/40'
  const bluepillLabelCls = isMatrix
    ? 'text-bluepill-text/40'
    : 'text-bluepill-accent font-bold'
  const indicatorCls = isMatrix ? 'bg-matrix-green/15' : 'bg-bluepill-accent/15'
  const tooltipCls = isMatrix
    ? 'bg-bg-void/90 text-text-primary/70'
    : 'bg-bluepill-bg/90 text-bluepill-text/70'

  return (
    <span className="group relative inline-flex">
      {/* flavor text demoted to a hover/focus tooltip to save navbar space */}
      <span
        role="tooltip"
        className={`pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 font-mono text-[10px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${tooltipCls}`}
      >
        &gt; choose your reality
      </span>

      <button
        type="button"
        role="switch"
        aria-pressed={isMatrix}
        aria-label={`Theme: ${isMatrix ? 'matrix' : 'bluepill'}. Activate ${
          isMatrix ? 'bluepill' : 'matrix'
        } theme.`}
        onClick={toggleTheme}
        className={`relative inline-flex items-center overflow-hidden rounded border px-2 py-1 font-mono text-xs ${borderCls}`}
      >
        {/* sliding indicator between the two labels */}
        <motion.span
          aria-hidden="true"
          className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded ${indicatorCls}`}
          animate={{ x: isMatrix ? '0%' : '100%' }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 500, damping: 35 }
          }
        />
        <span className={`relative z-10 w-14 text-center ${matrixLabelCls}`}>matrix</span>
        <span className={`relative z-10 w-14 text-center ${bluepillLabelCls}`}>bluepill</span>
      </button>
    </span>
  )
}
