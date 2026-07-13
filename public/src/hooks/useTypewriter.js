import { useState, useEffect, useRef, useCallback } from 'react'

export default function useTypewriter(
  strings,
  {
    typeSpeed = 80,
    deleteSpeed = 40,
    pauseDuration = 2000,
  } = {},
) {
  const [display, setDisplay] = useState('')
  const indexRef = useRef(0)
  const charRef = useRef(0)
  const deletingRef = useRef(false)
  const pausedRef = useRef(false)

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  useEffect(() => {
    if (!strings || strings.length === 0) return

    let cancelled = false

    const run = async () => {
      while (!cancelled) {
        const current = strings[indexRef.current]

        if (!deletingRef.current) {
          charRef.current++
          setDisplay(current.slice(0, charRef.current))

          if (charRef.current === current.length) {
            pausedRef.current = true
            await sleep(pauseDuration)
            if (cancelled) return
            pausedRef.current = false
            deletingRef.current = true
          } else {
            await sleep(typeSpeed)
          }
        } else {
          charRef.current--
          setDisplay(current.slice(0, charRef.current))

          if (charRef.current === 0) {
            deletingRef.current = false
            indexRef.current = (indexRef.current + 1) % strings.length
            await sleep(typeSpeed)
          } else {
            await sleep(deleteSpeed)
          }
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [strings, typeSpeed, deleteSpeed, pauseDuration])

  const reset = useCallback(() => {
    indexRef.current = 0
    charRef.current = 0
    deletingRef.current = false
    pausedRef.current = false
    setDisplay('')
  }, [])

  return { display, reset }
}
