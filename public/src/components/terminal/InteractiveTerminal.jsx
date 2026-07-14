import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import TerminalWindow from '../ui/TerminalWindow'
import { executeCommand } from './commands'

const PROMPT = 'visitor@portfolio:~$'

export default function InteractiveTerminal() {
  const { theme, toggleTheme } = useTheme()
  const isMatrix = theme === 'matrix'

  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState([
    {
      id: 0,
      type: 'output',
      text: "visitor@portfolio interactive shell — type 'help' to get started.",
    },
  ])
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState([])
  const [navIndex, setNavIndex] = useState(-1)

  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const idRef = useRef(1)

  // focus the input when the panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // keep the view pinned to the newest line
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, open])

  // Escape closes the terminal, but a project modal takes priority
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('[role="dialog"]')) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const promptColor = isMatrix ? 'text-matrix-green/70' : 'text-bluepill-accent-dark'
  const outColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const divider = isMatrix ? 'border-matrix-green/20' : 'border-bluepill-accent/20'
  const panelFrame = isMatrix
    ? 'border-matrix-green/30'
    : 'border-bluepill-accent/30'

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

  return (
    <>
      {/* persistent toggle button (bottom-right, always visible incl. mobile) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close terminal' : 'Open terminal'}
        aria-expanded={open}
        className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border font-mono text-lg shadow-lg transition-colors ${
          isMatrix
            ? 'border-matrix-green/50 bg-bg-void/90 text-matrix-green hover:bg-matrix-green/10'
            : 'border-bluepill-accent/50 bg-white/90 text-bluepill-accent-dark hover:bg-bluepill-accent/10'
        }`}
      >
        {open ? '×' : '>_'}
      </button>

      {/* terminal panel */}
      {open && (
        <section
          role="region"
          aria-label="Interactive terminal"
          className={`fixed bottom-20 right-4 z-50 flex w-[min(92vw,26rem)] flex-col overflow-hidden rounded-lg border shadow-2xl ${panelFrame}`}
        >
          <TerminalWindow
            title="visitor@portfolio: ~"
            className="!max-w-none !rounded-none !border-0 !bg-transparent"
          >
            <div className="flex h-72 flex-col">
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
                  <span
                    aria-hidden="true"
                    className="cursor-blink ml-px font-mono text-xs"
                  >
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
          </TerminalWindow>
        </section>
      )}
    </>
  )
}
