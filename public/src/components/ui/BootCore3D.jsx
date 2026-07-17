import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const TOTAL_BOOT_LINES = 5
const CANVAS_SIZE = 250

const THEME_COLORS = {
  matrix: 0x00ff41,
  bluepill: 0x2563eb,
}

export default function BootCore3D({ bootLineCount = 0 }) {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const rafRef = useRef(null)
  const materialRef = useRef(null)
  const meshRef = useRef(null)
  const progressRef = useRef(0)

  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const shouldReduceMotion = useReducedMotion()

  const hexColor = isMatrix ? THEME_COLORS.matrix : THEME_COLORS.bluepill
  const progress = Math.min(bootLineCount / TOTAL_BOOT_LINES, 1)

  progressRef.current = progress

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.z = 3.2

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(CANVAS_SIZE, CANVAS_SIZE)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const geometry = new THREE.IcosahedronGeometry(1, 1)
    const material = new THREE.MeshBasicMaterial({
      color: hexColor,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    })
    materialRef.current = material

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    meshRef.current = mesh

    renderer.render(scene, camera)

    if (!shouldReduceMotion) {
      const startTime = performance.now()
      const tick = () => {
        rafRef.current = requestAnimationFrame(tick)
        const elapsed = (performance.now() - startTime) / 1000

        mesh.rotation.x = elapsed * 0.35
        mesh.rotation.y = elapsed * 0.25

        const p = progressRef.current
        const pulse = 1 + Math.sin(elapsed * 2.5) * 0.06 * (0.4 + p * 0.6)
        mesh.scale.setScalar(pulse)

        renderer.render(scene, camera)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      geometry.dispose()
      material.dispose()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      meshRef.current = null
      materialRef.current = null
      rendererRef.current = null
    }
  }, [shouldReduceMotion, hexColor])

  useEffect(() => {
    if (meshRef.current && shouldReduceMotion) {
      const pulse = 1 + progress * 0.08
      meshRef.current.scale.setScalar(pulse)
    }
  }, [progress, shouldReduceMotion])

  return (
    <div
      className="mx-auto flex items-center justify-center"
      style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
    >
      <div ref={containerRef} />
    </div>
  )
}
