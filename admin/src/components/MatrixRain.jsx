import { useRef, useEffect } from 'react'

const CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const FONT_SIZE = 11
const COLUMN_SPACING = 30
const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS
const TRAIL_ALPHA = 0.05
const CHAR_ALPHA = 0.5
const BG_COLOR = '#0a0e0a'
const FG_COLOR = '#00ff41'

export default function MatrixRain({ active = true }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const lastFrameRef = useRef(0)
  const columnsRef = useRef([])
  const activeRef = useRef(active)

  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const cols = Math.floor(canvas.width / COLUMN_SPACING)
      const old = columnsRef.current
      columnsRef.current = Array.from({ length: cols }, (_, i) =>
        old[i] !== undefined
          ? old[i]
          : Math.floor(Math.random() * (canvas.height / FONT_SIZE)),
      )
    }

    resize()
    window.addEventListener('resize', resize)

    if (reducedMotion) {
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`
      const columns = columnsRef.current
      for (let i = 0; i < columns.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const x = i * COLUMN_SPACING
        const y = Math.floor(columns[i]) * FONT_SIZE
        ctx.globalAlpha = CHAR_ALPHA * (0.5 + Math.random() * 0.5)
        ctx.fillStyle = FG_COLOR
        ctx.fillText(char, x, y)
      }
      ctx.globalAlpha = 1
      return () => window.removeEventListener('resize', resize)
    }

    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const draw = (timestamp) => {
      animFrameRef.current = requestAnimationFrame(draw)

      if (!activeRef.current) return

      if (timestamp - lastFrameRef.current < FRAME_INTERVAL) return
      lastFrameRef.current = timestamp

      ctx.globalAlpha = 1
      ctx.fillStyle = `rgba(10, 14, 10, ${TRAIL_ALPHA})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`
      ctx.fillStyle = FG_COLOR
      ctx.globalAlpha = CHAR_ALPHA

      const columns = columnsRef.current
      for (let i = 0; i < columns.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const x = i * COLUMN_SPACING
        const y = Math.floor(columns[i]) * FONT_SIZE

        ctx.fillText(char, x, y)

        if (Math.random() > 0.985) {
          columns[i] = 0
        }
        columns[i]++
      }
    }

    animFrameRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: active ? 0.6 : 0,
        transition: reducedMotion ? 'none' : 'opacity 0.8s ease-in-out',
      }}
    />
  )
}
