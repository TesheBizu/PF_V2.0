import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion, useInView, animate } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import TechIcon from '../ui/TechIcon'

const PHI = (1 + Math.sqrt(5)) / 2
const FOCAL_LENGTH = 4
const SPHERE_RADIUS_PX = 180
const AUTO_ROTATE_SPEED = 0.3
const DRAG_SENSITIVITY = 0.005
const DRAG_CLICK_THRESHOLD = 5
const HOVER_DELAY_MS = 120
const RESUME_DELAY_MS = 2000
const CATEGORIES = ['Frontend', 'Backend', 'Database', 'Tools', 'Programming']

function fibonacciSphere(n) {
  const points = []
  for (let i = 0; i < n; i++) {
    const theta = Math.acos(1 - 2 * (i + 0.5) / n)
    const phi = (2 * Math.PI * i / PHI) % (2 * Math.PI)
    points.push({
      x: Math.sin(theta) * Math.cos(phi),
      y: Math.cos(theta),
      z: Math.sin(theta) * Math.sin(phi),
    })
  }
  return points
}

function rotateY(p, a) {
  const c = Math.cos(a), s = Math.sin(a)
  return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c }
}

function rotateX(p, a) {
  const c = Math.cos(a), s = Math.sin(a)
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c }
}

export default function SkillsSphere({ skills, loading }) {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const reduceMotion = useReducedMotion()

  const [view, setView] = useState(() => {
    if (reduceMotion) return 'grid'
    if (typeof window !== 'undefined' && window.innerWidth < 640) return 'grid'
    return 'sphere'
  })

  const toggleView = useCallback(() => {
    setView((v) => (v === 'sphere' ? 'grid' : 'sphere'))
  }, [])

  const toggleColor = isMatrix
    ? 'text-matrix-green/60 hover:text-matrix-green'
    : 'text-bluepill-accent-dark hover:text-bluepill-accent'

  if (loading) {
    const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'
    return <p className={`font-mono text-sm ${muted}`}>{'> loading skills...'}</p>
  }

  return (
    <>
      <button
        onClick={toggleView}
        className={`mb-8 font-mono text-xs transition-colors ${toggleColor}`}
      >
        {'>'} view: {view === 'sphere' ? 'list' : 'sphere'}
      </button>
      {view === 'sphere' ? (
        <SphereView skills={skills} isMatrix={isMatrix} />
      ) : (
        <GridView skills={skills} isMatrix={isMatrix} />
      )}
    </>
  )
}

function SphereView({ skills, isMatrix }) {
  const rotRef = useRef({ y: 0, x: 0.26 })
  const draggingRef = useRef(false)
  const lastPtrRef = useRef({ x: 0, y: 0 })
  const dragDistRef = useRef(0)
  const pausedRef = useRef(false)
  const resumeRef = useRef(null)
  const [, setTick] = useState(0)
  const [selected, setSelected] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const hoverTimerRef = useRef(null)
  const panelHoveredRef = useRef(false)
  const lastPtrTypeRef = useRef('mouse')

  const basePoints = useMemo(() => fibonacciSphere(skills.length), [skills.length])

  const textColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const iconColor = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const barColor = isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'
  const trackBg = isMatrix ? 'bg-matrix-dim/40' : 'bg-bluepill-accent/10'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'
  const panelBg = isMatrix ? 'bg-bg-surface' : 'bg-white/95'
  const panelBorder = isMatrix ? 'border-matrix-green/40' : 'border-bluepill-accent/40'
  const glowShadow = isMatrix
    ? '0 0 12px rgba(0,255,65,0.5)'
    : '0 0 12px rgba(37,99,235,0.5)'

  useEffect(() => {
    let rafId
    let last = performance.now()
    const tick_ = (now) => {
      const dt = (now - last) / 1000
      last = now
      if (!pausedRef.current) rotRef.current.y += AUTO_ROTATE_SPEED * dt
      setTick((t) => t + 1)
      rafId = requestAnimationFrame(tick_)
    }
    rafId = requestAnimationFrame(tick_)
    return () => {
      cancelAnimationFrame(rafId)
      if (resumeRef.current) clearTimeout(resumeRef.current)
    }
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return
      const dx = e.clientX - lastPtrRef.current.x
      const dy = e.clientY - lastPtrRef.current.y
      rotRef.current.y += dx * DRAG_SENSITIVITY
      rotRef.current.x = Math.max(-1, Math.min(1, rotRef.current.x + dy * DRAG_SENSITIVITY))
      dragDistRef.current += Math.abs(dx) + Math.abs(dy)
      lastPtrRef.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      pausedRef.current = true
      if (resumeRef.current) clearTimeout(resumeRef.current)
      resumeRef.current = setTimeout(() => { pausedRef.current = false }, RESUME_DELAY_MS)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelected(null)
        setHoveredId(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  const projected = skills.map((skill, i) => {
    const b = basePoints[i]
    let p = rotateX(b, rotRef.current.x)
    p = rotateY(p, rotRef.current.y)
    const s = FOCAL_LENGTH / (FOCAL_LENGTH + p.z)
    return {
      ...skill,
      ox: p.x * s * SPHERE_RADIUS_PX,
      oy: -p.y * s * SPHERE_RADIUS_PX,
      ns: 0.5 + 0.5 * (s - 0.8) / 0.53,
      op: 0.3 + 0.7 * (1 - (p.z + 1) / 2),
      zi: Math.round((1 - p.z) * 50),
    }
  })

  const hoveredPt = hoveredId ? projected.find((pt) => pt._id === hoveredId) ?? null : null
  const activeSkill = hoveredPt || selected

  const onDown = useCallback((e) => {
    draggingRef.current = true
    lastPtrRef.current = { x: e.clientX, y: e.clientY }
    dragDistRef.current = 0
    lastPtrTypeRef.current = e.pointerType
    setHoveredId(null)
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    if (resumeRef.current) clearTimeout(resumeRef.current)
  }, [])

  const onNodeTap = useCallback((skill) => {
    if (lastPtrTypeRef.current !== 'touch') return
    if (dragDistRef.current > DRAG_CLICK_THRESHOLD) return
    setSelected((prev) => (prev?._id === skill._id ? null : skill))
  }, [])

  const closePanel = useCallback(() => {
    setSelected(null)
    setHoveredId(null)
  }, [])

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[500px] touch-none select-none overflow-hidden"
      onPointerDown={onDown}
    >
      {projected.map((pt) => {
        const isHovered = hoveredId === pt._id
        return (
          <div
            key={pt._id}
            role="button"
            tabIndex={0}
            className={`absolute left-1/2 top-1/2 flex max-w-[120px] cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1.5 backdrop-blur-sm transition-all hover:!opacity-100`}
            style={{
              transform: `translate(-50%,-50%) translate(${pt.ox}px,${pt.oy}px) scale(${isHovered ? pt.ns * 1.1 : pt.ns})`,
              opacity: pt.op,
              zIndex: pt.zi,
              borderColor: isMatrix ? 'rgba(0,255,65,0.3)' : 'rgba(37,99,235,0.3)',
              backgroundColor: isMatrix ? 'rgba(10,14,10,0.7)' : 'rgba(255,255,255,0.7)',
              boxShadow: isHovered ? glowShadow : undefined,
            }}
            onClick={() => onNodeTap(pt)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelected((prev) => (prev?._id === pt._id ? null : pt))
              }
            }}
            onPointerEnter={(e) => {
              if (draggingRef.current || e.pointerType === 'touch') return
              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
              hoverTimerRef.current = setTimeout(() => {
                setHoveredId(pt._id)
                hoverTimerRef.current = null
              }, HOVER_DELAY_MS)
            }}
            onPointerLeave={() => {
              if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current)
                hoverTimerRef.current = null
              }
              hoverTimerRef.current = setTimeout(() => {
                if (!panelHoveredRef.current) setHoveredId(null)
                hoverTimerRef.current = null
              }, HOVER_DELAY_MS)
            }}
          >
            <TechIcon iconName={pt.iconName} conceptIcon={pt.conceptIcon} size={17} className={iconColor} />
            <span className={`truncate font-mono text-sm ${textColor}`}>{pt.name}</span>
          </div>
        )
      })}

      <AnimatePresence>
        {activeSkill && (
          <>
            {selected && (
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[199] bg-black/30"
                onClick={closePanel}
              />
            )}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute left-1/2 top-1/2 z-[200] w-64 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-4 backdrop-blur-md ${panelBg} ${panelBorder}`}
              onClick={(e) => e.stopPropagation()}
              onPointerEnter={() => {
                panelHoveredRef.current = true
                if (hoverTimerRef.current) {
                  clearTimeout(hoverTimerRef.current)
                  hoverTimerRef.current = null
                }
              }}
              onPointerLeave={() => {
                panelHoveredRef.current = false
                if (!selected) setHoveredId(null)
              }}
            >
              <button
                onClick={closePanel}
                className="absolute right-2 top-2 font-mono text-xs opacity-50 hover:opacity-100"
              >
                ✕
              </button>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TechIcon iconName={activeSkill.iconName} conceptIcon={activeSkill.conceptIcon} size={20} className={iconColor} />
                  <h3 className={`font-mono text-lg font-bold ${textColor}`}>{activeSkill.name}</h3>
                </div>
                <p className={`font-mono text-xs ${muted}`}>{activeSkill.category}</p>
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className={`font-mono text-xs ${textColor}`}>Proficiency</span>
                    <span className={`font-data text-xs ${textColor}`}>{activeSkill.proficiency}%</span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${trackBg}`}>
                    <motion.div
                      className={`h-full rounded-full ${barColor}`}
                      initial={{ width: '0%' }}
                      animate={{ width: `${activeSkill.proficiency}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                {activeSkill.yearsExperience != null && (
                  <p className={`font-mono text-xs ${muted}`}>
                    Experience: <span className={textColor}>{activeSkill.yearsExperience} years</span>
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function GridView({ skills, isMatrix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.15 })
  const reduce = useReducedMotion()

  const subColor = isMatrix ? 'text-matrix-green/70' : 'text-bluepill-accent-dark'
  const barColor = isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'
  const borderColor = isMatrix ? 'border-matrix-green/30' : 'border-bluepill-accent/30'
  const trackBg = isMatrix ? 'bg-matrix-dim/40' : 'bg-bluepill-accent/10'
  const textColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const iconColor = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'

  const groups = useMemo(() => {
    let idx = 0
    return CATEGORIES.map((cat) => {
      const items = skills.filter((s) => s.category === cat)
      const start = idx
      idx += items.length
      return { category: cat, items, start }
    }).filter((g) => g.items.length > 0)
  }, [skills])

  return (
    <div ref={ref} className="space-y-12">
      {groups.map((group) => (
        <div key={group.category}>
          <h3 className={`mb-4 font-mono text-lg ${subColor}`}>
            <span className="opacity-60">$</span> {group.category}
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {group.items.map((skill, i) => (
              <SkillBar
                key={skill._id}
                skill={skill}
                barColor={barColor}
                borderColor={borderColor}
                trackBg={trackBg}
                textColor={textColor}
                iconColor={iconColor}
                delay={reduce ? 0 : Math.min((group.start + i) * 0.07, 0.9)}
                inView={inView}
                reduce={reduce}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillBar({ skill, barColor, borderColor, trackBg, textColor, iconColor, delay, inView, reduce }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) { setPct(skill.proficiency); return }
    const c = animate(0, skill.proficiency, {
      duration: 1.1, delay, ease: 'easeOut',
      onUpdate: (v) => setPct(Math.round(v)),
    })
    return () => c.stop()
  }, [inView, skill.proficiency, delay, reduce])

  return (
    <div className={`rounded-md border px-3 py-3 ${borderColor}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`flex min-w-0 items-center gap-1.5 truncate font-mono text-sm ${textColor}`}>
          <TechIcon iconName={skill.iconName} conceptIcon={skill.conceptIcon} size={14} className={`shrink-0 ${iconColor}`} />
          {skill.name}
        </span>
        <span className={`shrink-0 font-data text-xs ${textColor}`}>{pct}%</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <div className={`h-2 flex-1 overflow-hidden rounded-full ${trackBg}`}>
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: '0%' }}
            animate={{ width: inView ? `${skill.proficiency}%` : '0%' }}
            transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : delay, ease: 'easeOut' }}
          />
        </div>
        {skill.yearsExperience != null && (
          <span className={`ml-2 shrink-0 font-data text-[10px] ${textColor}`}>
            {skill.yearsExperience} yrs
          </span>
        )}
      </div>
    </div>
  )
}
