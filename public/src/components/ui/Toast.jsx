import { useEffect, useCallback, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { useReducedMotion } from 'framer-motion'

const TARGET_PHASE_MS = 900
const HOLD_MS = 2100
const REDUCED_TOTAL_MS = HOLD_MS + TARGET_PHASE_MS * 2

function rate(len) {
  return Math.max(1, Math.ceil(TARGET_PHASE_MS / len))
}

export default function Toast({ message, type = 'success', onDismiss }) {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const reduce = useReducedMotion()

  const [display, setDisplay] = useState('')
  const [phase, setPhase] = useState(reduce && message ? 'hold' : 'idle')
  const timers = useRef({ type: null, hold: null, erase: null })

  const clearTimers = useCallback(() => {
    const t = timers.current
    clearInterval(t.type)
    clearTimeout(t.hold)
    clearInterval(t.erase)
    timers.current = { type: null, hold: null, erase: null }
  }, [])

  const dismiss = useCallback(() => onDismiss?.(), [onDismiss])

  useEffect(() => {
    clearTimers()
    if (!message) {
      setDisplay('')
      setPhase('idle')
      return
    }

    if (reduce) {
      setDisplay(message)
      setPhase('hold')
      const id = setTimeout(() => {
        setPhase('done')
        dismiss()
      }, REDUCED_TOTAL_MS)
      return () => clearTimeout(id)
    }

    const r = rate(message.length)
    let pos = 0
    setDisplay('')
    setPhase('type')

    timers.current.type = setInterval(() => {
      pos++
      setDisplay(message.slice(0, pos))
      if (pos >= message.length) {
        clearInterval(timers.current.type)
        timers.current.type = null
        setPhase('hold')

        timers.current.hold = setTimeout(() => {
          setPhase('erase')
          let erasePos = 0

          timers.current.erase = setInterval(() => {
            erasePos++
            setDisplay(message.slice(erasePos))
            if (erasePos >= message.length) {
              clearInterval(timers.current.erase)
              timers.current.erase = null
              setPhase('done')
              dismiss()
            }
          }, r)
        }, HOLD_MS)
      }
    }, r)

    return clearTimers
  }, [message, reduce, dismiss, clearTimers])

  const isSuccess = type === 'success'
  const cursorColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const prefix = isSuccess ? '>' : '!'

  const textColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-text'
  const prefixColor = isMatrix
    ? isSuccess
      ? 'text-matrix-green'
      : 'text-alert'
    : isSuccess
      ? 'text-bluepill-accent'
      : 'text-alert'
  const xColor = isMatrix ? 'text-matrix-green/50' : 'text-gray-400'
  const textShadow = isMatrix
    ? '1px 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)'
    : '0 1px 2px rgba(0,0,0,0.08)'

  const showCursor = phase === 'type' || phase === 'hold' || phase === 'erase'

  if (reduce) {
    return createPortal(
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 right-4 z-[60]"
      >
        <AnimatePresence>
          {message && phase !== 'done' && (
            <motion.div
              key={message}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              className={`pointer-events-auto flex items-start gap-2 font-mono text-sm leading-snug ${textColor}`}
              style={{ textShadow }}
            >
              <span className={`shrink-0 select-none ${prefixColor}`}>{prefix}</span>
              <span className="flex-1 break-words">{message}</span>
              <button
                type="button"
                onClick={dismiss}
                className={`shrink-0 p-2 transition-opacity hover:opacity-100 ${xColor}`}
                aria-label="Dismiss notification"
              >
                x
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 right-4 z-[60]"
    >
      <AnimatePresence>
        {message && phase !== 'done' && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`pointer-events-auto flex items-start gap-2 font-mono text-sm leading-snug ${textColor}`}
            style={{ textShadow }}
          >
            <span className={`shrink-0 select-none ${prefixColor}`}>{prefix}</span>
            <span className="flex-1 break-words">
              {phase === 'erase' && (
                <span className={`cursor-blink ${cursorColor}`} aria-hidden="true">
                  ▌
                </span>
              )}
              {display}
              {(phase === 'type' || phase === 'hold') && showCursor && (
                <span className={`cursor-blink ${cursorColor}`} aria-hidden="true">
                  ▌
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={dismiss}
              className={`shrink-0 p-2 transition-opacity hover:opacity-100 ${xColor}`}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
