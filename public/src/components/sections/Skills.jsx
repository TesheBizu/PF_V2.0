import { useRef, useState, useEffect, useMemo } from 'react'
import { motion, useInView, useReducedMotion, animate } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import api from '../../lib/api'
import socket from '../../lib/socket'
import TerminalReveal from '../ui/TerminalReveal'
import TechIcon from '../ui/TechIcon'

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'Tools', 'Programming']

export default function Skills() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const reduce = useReducedMotion()

  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.15 })

  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .get('/skills')
      .then((res) => {
        if (!cancelled) setSkills(res.data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('skills:created', (s) => {
      if (s.isVisible) setSkills((prev) => [...prev, s])
    })

    socket.on('skills:updated', (s) => {
      setSkills((prev) => {
        const exists = prev.some((x) => x._id === s._id)
        if (s.isVisible) {
          return exists
            ? prev.map((x) => (x._id === s._id ? s : x))
            : [...prev, s]
        }
        return exists ? prev.filter((x) => x._id !== s._id) : prev
      })
    })

    socket.on('skills:deleted', ({ id }) => {
      setSkills((prev) => prev.filter((x) => x._id !== id))
    })

    socket.on('skills:reordered', (list) => {
      setSkills(list.filter((s) => s.isVisible))
    })

    return () => {
      socket.off('skills:created')
      socket.off('skills:updated')
      socket.off('skills:deleted')
      socket.off('skills:reordered')
      socket.disconnect()
    }
  }, [])

  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subColor = isMatrix ? 'text-matrix-green/70' : 'text-bluepill-accent-dark'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'
  const textColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const barColor = isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'
  const borderColor = isMatrix ? 'border-matrix-green/30' : 'border-bluepill-accent/30'
  const trackBg = isMatrix ? 'bg-matrix-dim/40' : 'bg-bluepill-accent/10'

  const groups = useMemo(() => {
    let idx = 0
    return CATEGORIES.map((category) => {
      const items = skills.filter((s) => s.category === category)
      const start = idx
      idx += items.length
      return { category, items, start }
    }).filter((g) => g.items.length > 0)
  }, [skills])

  return (
    <section ref={sectionRef} id='skills' className='px-6 py-24'>
      <div className='mx-auto max-w-5xl'>
        <h2 className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span>{' '}
          <TerminalReveal mode="type" text="scanning_skills.exe" as="span" />
        </h2>
        <p className={`mb-12 font-mono text-sm ${muted}`}>
          <span className='opacity-60'>$</span> initializing skill matrix...
        </p>

        <div className='space-y-12'>
          {loading ? (
            <p className={`font-mono text-sm ${muted}`}>{'> loading skills...'}</p>
          ) : groups.map((group) => (
            <div key={group.category}>
              <h3 className={`mb-4 font-mono text-lg ${subColor}`}>
                <span className='opacity-60'>$</span>{' '}
                <TerminalReveal mode="type" text={group.category} as="span" />
              </h3>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
                {group.items.map((skill, i) => {
                  const delay = reduce ? 0 : Math.min((group.start + i) * 0.07, 0.9)
                  return (
                    <SkillBar
                      key={skill._id}
                      name={skill.name}
                      iconName={skill.iconName}
                      conceptIcon={skill.conceptIcon}
                      proficiency={skill.proficiency}
                      yearsExperience={skill.yearsExperience}
                      barColor={barColor}
                      borderColor={borderColor}
                      trackBg={trackBg}
                      textColor={textColor}
                      iconColor={accent}
                      delay={delay}
                      inView={inView}
                      reduce={reduce}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SkillBar({
  name,
  iconName,
  conceptIcon,
  proficiency,
  yearsExperience,
  barColor,
  borderColor,
  trackBg,
  textColor,
  iconColor,
  delay,
  inView,
  reduce,
}) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setPct(proficiency)
      return
    }
    const controls = animate(0, proficiency, {
      duration: 1.1,
      delay,
      ease: 'easeOut',
      onUpdate: (v) => setPct(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, proficiency, delay, reduce])

  return (
    <div className={`rounded-md border px-3 py-3 ${borderColor}`}>
      <div className='flex items-center justify-between gap-2'>
        <span className={`flex min-w-0 items-center gap-1.5 truncate font-mono text-sm ${textColor}`}>
          <TechIcon iconName={iconName} conceptIcon={conceptIcon} size={14} className={`shrink-0 ${iconColor}`} />
          {name}
        </span>
        <span className={`shrink-0 font-data text-xs ${textColor}`}>{pct}%</span>
      </div>
      <div className='mt-1 flex items-center justify-between'>
        <div className={`h-2 flex-1 overflow-hidden rounded-full ${trackBg}`}>
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: '0%' }}
            animate={{ width: inView ? `${proficiency}%` : '0%' }}
            transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : delay, ease: 'easeOut' }}
          />
        </div>
        {yearsExperience != null && (
          <span className={`ml-2 shrink-0 font-data text-[10px] ${textColor}`}>
            {yearsExperience} yrs
          </span>
        )}
      </div>
    </div>
  )
}
