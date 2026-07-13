import { useRef, useState, useEffect, useMemo } from 'react'
import { motion, useInView, useReducedMotion, animate } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const SKILLS = [
  // Frontend
  { name: 'React', category: 'Frontend', proficiency: 92 },
  { name: 'Next.js', category: 'Frontend', proficiency: 80 },
  { name: 'TypeScript', category: 'Frontend', proficiency: 88 },
  { name: 'Tailwind CSS', category: 'Frontend', proficiency: 90 },
  { name: 'Framer Motion', category: 'Frontend', proficiency: 75 },
  { name: 'Redux', category: 'Frontend', proficiency: 78 },
  // Backend
  { name: 'Node.js', category: 'Backend', proficiency: 90 },
  { name: 'Express', category: 'Backend', proficiency: 88 },
  { name: 'Python', category: 'Backend', proficiency: 72 },
  { name: 'GraphQL', category: 'Backend', proficiency: 70 },
  { name: 'REST APIs', category: 'Backend', proficiency: 92 },
  // Database
  { name: 'MongoDB', category: 'Database', proficiency: 90 },
  { name: 'PostgreSQL', category: 'Database', proficiency: 80 },
  { name: 'Redis', category: 'Database', proficiency: 68 },
  { name: 'Mongoose', category: 'Database', proficiency: 85 },
  // Tools
  { name: 'Git', category: 'Tools', proficiency: 90 },
  { name: 'Docker', category: 'Tools', proficiency: 74 },
  { name: 'Vite', category: 'Tools', proficiency: 86 },
  { name: 'Linux', category: 'Tools', proficiency: 82 },
  { name: 'Postman', category: 'Tools', proficiency: 80 },
]

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'Tools']

export default function Skills() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const reduce = useReducedMotion()

  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.15 })

  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subColor = isMatrix ? 'text-matrix-green/70' : 'text-bluepill-accent-dark'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'
  const textColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const barColor = isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'
  const borderColor = isMatrix ? 'border-matrix-green/20' : 'border-bluepill-accent/20'
  const trackBg = isMatrix ? 'bg-matrix-dim/40' : 'bg-bluepill-accent/10'

  const groups = useMemo(() => {
    let idx = 0
    return CATEGORIES.map((category) => {
      const items = SKILLS.filter((s) => s.category === category)
      const start = idx
      idx += items.length
      return { category, items, start }
    })
  }, [])

  return (
    <section ref={sectionRef} id='skills' className='px-6 py-24'>
      <div className='mx-auto max-w-5xl'>
        <h2 className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span> scanning_skills.exe
        </h2>
        <p className={`mb-12 font-mono text-sm ${muted}`}>
          <span className='opacity-60'>$</span> initializing skill matrix...
        </p>

        <div className='space-y-12'>
          {groups.map((group) => (
            <div key={group.category}>
              <h3 className={`mb-4 font-mono text-lg ${subColor}`}>
                <span className='opacity-60'>$</span> {group.category}
              </h3>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
                {group.items.map((skill, i) => {
                  const delay = reduce ? 0 : Math.min((group.start + i) * 0.07, 0.9)
                  return (
                    <SkillBar
                      key={skill.name}
                      name={skill.name}
                      proficiency={skill.proficiency}
                      barColor={barColor}
                      borderColor={borderColor}
                      trackBg={trackBg}
                      textColor={textColor}
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
  proficiency,
  barColor,
  borderColor,
  trackBg,
  textColor,
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
      <div className='flex items-baseline justify-between gap-2'>
        <span className={`truncate font-mono text-sm ${textColor}`}>{name}</span>
        <span className={`shrink-0 font-data text-xs ${textColor}`}>{pct}%</span>
      </div>
      <div className={`mt-2 h-2 w-full overflow-hidden rounded-full ${trackBg}`}>
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: '0%' }}
          animate={{ width: inView ? `${proficiency}%` : '0%' }}
          transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
