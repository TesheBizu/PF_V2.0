import { useRef, useEffect } from 'react'
import { createNoise2D } from 'simplex-noise'
import { useReducedMotion } from 'framer-motion'

const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS

const NOISE_SPEED = 0.0004
const NOISE_SCALE = 0.0015
const DRIFT_RANGE = 0.18
const GRAIN_OPACITY = 0.035

const COLOR_POINTS = [
  { baseX: 0.72, baseY: 0.22, r: 0.38, color: [37, 99, 235] },
  { baseX: 0.88, baseY: 0.55, r: 0.32, color: [139, 92, 246] },
  { baseX: 0.65, baseY: 0.78, r: 0.30, color: [167, 139, 250] },
  { baseX: 0.82, baseY: 0.15, r: 0.28, color: [232, 121, 249] },
  { baseX: 0.58, baseY: 0.48, r: 0.35, color: [99, 102, 241] },
]

export default function MeshGradientBackground() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const lastFrameRef = useRef(0)

  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const noise2D = createNoise2D()
    let startTime = performance.now()

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    resize()

    const grainCanvas = document.createElement('canvas')
    const grainSize = 128
    grainCanvas.width = grainSize
    grainCanvas.height = grainSize
    const grainCtx = grainCanvas.getContext('2d')
    const grainImageData = grainCtx.createImageData(grainSize, grainSize)
    for (let i = 0; i < grainImageData.data.length; i += 4) {
      const v = Math.random() * 255
      grainImageData.data[i] = v
      grainImageData.data[i + 1] = v
      grainImageData.data[i + 2] = v
      grainImageData.data[i + 3] = 255
    }
    grainCtx.putImageData(grainImageData, 0, 0)

    const drawFrame = (time) => {
      const w = canvas.width
      const h = canvas.height
      if (w === 0 || h === 0) return

      const t = (time - startTime) * NOISE_SPEED

      ctx.clearRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'screen'

      for (const pt of COLOR_POINTS) {
        const offsetX = noise2D(pt.baseX * 10, t) * DRIFT_RANGE
        const offsetY = noise2D(pt.baseY * 10, t + 100) * DRIFT_RANGE

        const cx = (pt.baseX + offsetX) * w
        const cy = (pt.baseY + offsetY) * h
        const radius = pt.r * Math.max(w, h)

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        const [r, g, b] = pt.color
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`)
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.25)`)
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
      }

      ctx.globalCompositeOperation = 'source-over'

      const pattern = ctx.createPattern(grainCanvas, 'repeat')
      if (pattern) {
        ctx.globalAlpha = GRAIN_OPACITY
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, w, h)
        ctx.globalAlpha = 1
      }
    }

    if (shouldReduceMotion) {
      drawFrame(performance.now())
      return () => {
        window.removeEventListener('resize', resize)
      }
    }

    window.addEventListener('resize', resize)

    const tick = (timestamp) => {
      rafRef.current = requestAnimationFrame(tick)
      if (timestamp - lastFrameRef.current < FRAME_INTERVAL) return
      lastFrameRef.current = timestamp
      drawFrame(timestamp)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [shouldReduceMotion])

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  )
}
