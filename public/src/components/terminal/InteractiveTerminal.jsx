import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useDragControls,
  useMotionValue,
} from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import TerminalWindow from '../ui/TerminalWindow'
import { executeCommand } from './commands'
import { trackEvent } from '../../lib/analytics'

const PROMPT = 'visitor@portfolio:~$'
const MIN_W = 320
const MIN_H = 240
const MAX_W = () => window.innerWidth * 0.9
const MAX_H = () => window.innerHeight * 0.9
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

const WELCOME = {
  id: 0,
  type: 'output',
  text: "visitor@portfolio interactive shell — type 'help' to get started.",
}

export default function InteractiveTerminal() {
  const { theme, toggleTheme } = useTheme()
  const isMatrix = theme === 'matrix'

  const [launched, setLaunched] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ width: 400, height: 320 })
  const [history, setHistory] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState([])
  const [navIndex, setNavIndex] = useState(-1)
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 640px)').matches,
  )

  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const idRef = useRef(1)
  const constraintsRef = useRef(null)
  const x = useMotionValue(pos.x)
  const y = useMotionValue(pos.y)
  const dragControls = useDragControls()

  // track viewport size for the mobile bottom-sheet switch
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // focus the input when the panel opens / is restored
  useEffect(() => {
    if (launched && !minimized) inputRef.current?.focus()
  }, [launched, minimized])

  // keep the view pinned to the newest line
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, launched, minimized])

  // Escape closes the terminal, but a project modal takes priority
  useEffect(() => {
    if (!launched || minimized) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('[role="dialog"]')) return
      setLaunched(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [launched, minimized])

  const promptColor = isMatrix ? 'text-matrix-green/70' : 'text-bluepill-accent-dark'
  const outColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const divider = isMatrix ? 'border-matrix-green/20' : 'border-bluepill-accent/20'
  const panelFrame = isMatrix
    ? 'border-matrix-green/30'
    : 'border-bluepill-accent/30'
  const terminalBg = isMatrix ? 'bg-bg-void' : 'bg-white'
  const opaqueOverride = isMatrix ? '!bg-bg-void' : '!bg-white'
  const glowColor = isMatrix ? 'rgba(0, 255, 65, 0.4)' : 'rgba(37, 99, 235, 0.4)'

  const buildCtx = () => ({
    navigate: (id) => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    setTheme: (name) => {
      if (theme !== name) toggleTheme()
    },
    clear: () => setHistory([]),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = input
    const cmd = value.trim()
    setInput('')
    setNavIndex(-1)

    if (!cmd) {
      setHistory((h) => [...h, { id: idRef.current++, type: 'command', text: '' }])
      return
    }

    setCmdHistory((c) => [...c, cmd])
    trackEvent('terminal_command', { command: cmd })

    const { output, clear } = executeCommand(cmd, buildCtx())
    if (clear) {
      setHistory([])
      return
    }

    setHistory((h) => [
      ...h,
      { id: idRef.current++, type: 'command', text: value },
      ...output.map((line) => ({ id: idRef.current++, type: 'output', text: line })),
    ])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length === 0) return
      const next = navIndex === -1 ? cmdHistory.length - 1 : Math.max(0, navIndex - 1)
      setNavIndex(next)
      setInput(cmdHistory[next])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (navIndex === -1) return
      const next = navIndex + 1
      if (next >= cmdHistory.length) {
        setNavIndex(-1)
        setInput('')
      } else {
        setNavIndex(next)
        setInput(cmdHistory[next])
      }
    }
  }

  const startResize = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.width
    const startH = size.height
    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      setSize({
        width: clamp(startW + dx, MIN_W, MAX_W()),
        height: clamp(startH + dy, MIN_H, MAX_H()),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
    }
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const terminalBody = (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed ${outColor}`}
      >
        {history.map((line) => (
          <div
            key={line.id}
            className={line.type === 'command' ? `font-semibold ${promptColor}` : ''}
            aria-hidden={line.type === 'command' ? undefined : 'true'}
          >
            {line.type === 'command' ? `${PROMPT} ${line.text}` : line.text}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`mt-2 flex items-center gap-2 border-t pt-2 ${divider}`}
      >
        <span className={`shrink-0 font-mono text-xs ${promptColor}`}>{PROMPT}</span>
        <div className="relative flex-1">
          <span
            aria-hidden="true"
            className={`whitespace-pre font-mono text-xs ${outColor}`}
          >
            {input}
          </span>
          <span aria-hidden="true" className="cursor-blink ml-px font-mono text-xs">
            ▋
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Terminal input"
            autoComplete="off"
            spellCheck={false}
            className="absolute inset-0 w-full bg-transparent font-mono text-xs text-transparent caret-transparent outline-none"
          />
        </div>
      </form>
    </div>
  )

  return (
    <>
      {/* launcher — only shown when the terminal isn't active */}
      {!launched && (
        <button
          type="button"
          onClick={() => setLaunched(true)}
          aria-label="Open terminal"
          style={{ '--glow-color': glowColor }}
          className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border font-mono text-lg shadow-lg transition-colors terminal-glow ${
            isMatrix
              ? 'border-matrix-green/50 bg-bg-surface text-matrix-green hover:bg-matrix-green/10'
              : 'border-bluepill-accent/50 bg-white/90 text-bluepill-accent-dark hover:bg-bluepill-accent/10'
          }`}
        >
          {'>_'}
        </button>
      )}

      {/* minimized pill — click to restore */}
      {launched && minimized && (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          aria-label="Restore terminal"
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border px-4 py-3 font-mono text-xs shadow-lg transition-colors ${
            isMatrix
              ? 'border-matrix-green/50 bg-bg-surface text-matrix-green hover:bg-matrix-green/10'
              : 'border-bluepill-accent/50 bg-white/90 text-bluepill-accent-dark hover:bg-bluepill-accent/10'
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          visitor@portfolio: ~
        </button>
      )}

      {/* full panel — desktop (draggable + resizable) */}
      {launched && !minimized && !isMobile && (
        <div
          ref={constraintsRef}
          className="pointer-events-none fixed inset-0 z-50"
        >
          <motion.section
            drag
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onDragEnd={() => setPos({ x: x.get(), y: y.get() })}
            style={{ x, y, width: size.width, height: size.height }}
            className={`pointer-events-auto absolute bottom-4 right-4 flex flex-col overflow-hidden rounded-lg border shadow-2xl ${panelFrame} ${terminalBg}`}
          >
            <TerminalWindow
              title="visitor@portfolio: ~"
              fill
              onMinimize={() => setMinimized(true)}
              onClose={() => setLaunched(false)}
              onTitlePointerDown={(e) => dragControls.start(e)}
              className={`!max-w-none !rounded-none !border-0 ${opaqueOverride} flex h-full flex-col`}
            >
              {terminalBody}
            </TerminalWindow>

            {/* resize grip (bottom-right) */}
            <div
              onPointerDown={startResize}
              aria-hidden="true"
              className="absolute bottom-1 right-1 flex h-4 w-4 cursor-se-resize items-end justify-end"
            >
              <svg viewBox="0 0 10 10" className="h-3 w-3 text-current/50" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 1L1 9M9 5L5 9" strokeLinecap="round" />
              </svg>
            </div>
          </motion.section>
        </div>
      )}

      {/* full panel — mobile (bottom sheet, no drag/resize) */}
      {launched && !minimized && isMobile && (
        <div
          role="region"
          aria-label="Interactive terminal"
          className={`fixed inset-x-0 bottom-0 z-50 flex h-[50vh] w-full flex-col overflow-hidden rounded-t-xl border-t shadow-2xl ${panelFrame} ${terminalBg}`}
        >
          <TerminalWindow
            title="visitor@portfolio: ~"
            fill
            onMinimize={() => setMinimized(true)}
            onClose={() => setLaunched(false)}
            className={`!max-w-none !rounded-none !border-0 ${opaqueOverride} flex h-full flex-col`}
          >
            {terminalBody}
          </TerminalWindow>
        </div>
      )}
    </>
  )
}
