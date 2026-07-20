import { AnimatePresence, motion } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import { X } from 'lucide-react'

const TYPE_STYLES = {
  success: {
    matrix: 'border-matrix-green/40 bg-matrix-green/10 text-matrix-green',
    bluepill: 'border-green-300 bg-green-50 text-green-700',
  },
  error: {
    matrix: 'border-alert/40 bg-alert/10 text-alert',
    bluepill: 'border-red-300 bg-red-50 text-red-600',
  },
  info: {
    matrix: 'border-matrix-green/20 bg-bg-void text-text-primary',
    bluepill: 'border-gray-200 bg-white text-gray-700',
  },
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const styles = TYPE_STYLES[toast.type] || TYPE_STYLES.info
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded border px-4 py-3 font-mono text-sm shadow-lg backdrop-blur-sm ${
                isMatrix ? 'bg-bg-surface' : 'bg-white/90'
              } ${styles[isMatrix ? 'matrix' : 'bluepill']}`}
            >
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className={`shrink-0 transition-colors ${
                  isMatrix ? 'text-matrix-dim hover:text-matrix-green' : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
