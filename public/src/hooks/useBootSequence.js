import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'pf-boot-played'

const BOOT_LINES = [
  'Initializing system...',
  'Loading modules: react, express, mongodb... OK',
  'Establishing secure connection...',
  'Access granted.',
  'Welcome, visitor.',
]

export default function useBootSequence({ lines = BOOT_LINES, delay = 400 } = {}) {
  const [shownLines, setShownLines] = useState([])
  const [isBooting, setIsBooting] = useState(true)
  const indexRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setIsBooting(false)
        setShownLines(lines)
        return
      }
    } catch {}

    let cancelled = false

    const tick = () => {
      if (cancelled) return

      if (indexRef.current < lines.length) {
        setShownLines((prev) => [...prev, lines[indexRef.current]])
        indexRef.current++
        timerRef.current = setTimeout(tick, delay)
      } else {
        try {
          sessionStorage.setItem(STORAGE_KEY, '1')
        } catch {}
        setIsBooting(false)
      }
    }

    timerRef.current = setTimeout(tick, delay)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [lines, delay])

  const skipBoot = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setShownLines(lines)
    setIsBooting(false)
  }, [lines])

  return { lines: shownLines, isBooting, skipBoot }
}
