import { useRef, useState, useEffect, useMemo } from 'react'
import { motion, useInView, useReducedMotion, animate } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import TerminalReveal from '../ui/TerminalReveal'
import TechIcon from '../ui/TechIcon'

const SKILLS = [
  // Frontend
  { name: 'React', category: 'Frontend', proficiency: 92, icon: 'SiReact', brandColor: '#61DAFB' },
  { name: 'Next.js', category: 'Frontend', proficiency: 80, icon: 'SiNextdotjs', brandColor: '#000000' },
  { name: 'TypeScript', category: 'Frontend', proficiency: 88, icon: 'SiTypescript', brandColor: '#3178C6' },
  { name: 'Tailwind CSS', category: 'Frontend', proficiency: 90, icon: 'SiTailwindcss', brandColor: '#06B6D4' },
  { name: 'Framer Motion', category: 'Frontend', proficiency: 75, icon: 'SiFramer', brandColor: '#0055FF' },
  { name: 'Redux', category: 'Frontend', proficiency: 78, icon: 'SiRedux', brandColor: '#764ABC' },
  // Backend
  { name: 'Node.js', category: 'Backend', proficiency: 90, icon: 'SiNodedotjs', brandColor: '#5FA04E' },
  { name: 'Express', category: 'Backend', proficiency: 88, icon: 'SiExpress', brandColor: '#000000' },
  { name: 'Python', category: 'Backend', proficiency: 72, icon: 'SiPython', brandColor: '#3776AB' },
  { name: 'GraphQL', category: 'Backend', proficiency: 70, icon: 'SiGraphql', brandColor: '#E10098' },
  { name: 'REST APIs', category: 'Backend', proficiency: 92, icon: 'FiCode', brandColor: '#6B7280' },
  // Database
  { name: 'MongoDB', category: 'Database', proficiency: 90, icon: 'SiMongodb', brandColor: '#47A248' },
  { name: 'PostgreSQL', category: 'Database', proficiency: 80, icon: 'SiPostgresql', brandColor: '#4169E1' },
  { name: 'Redis', category: 'Database', proficiency: 68, icon: 'SiRedis', brandColor: '#FF4438' },
  { name: 'Mongoose', category: 'Database', proficiency: 85, icon: 'SiMongoose', brandColor: '#880000' },
  // Tools
  { name: 'Git', category: 'Tools', proficiency: 90, icon: 'SiGit', brandColor: '#F03C2E' },
  { name: 'Docker', category: 'Tools', proficiency: 74, icon: 'SiDocker', brandColor: '#2496ED' },
  { name: 'Vite', category: 'Tools', proficiency: 86, icon: 'SiVite', brandColor: '#9135FF' },
  { name: 'Linux', category: 'Tools', proficiency: 82, icon: 'SiLinux', brandColor: '#FCC624' },
  { name: 'Postman', category: 'Tools', proficiency: 80, icon: 'SiPostman', brandColor: '#FF6C37' },
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
  const borderColor = isMatrix ? 'border-matrix-green/30' : 'border-bluepill-accent/30'
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
          <span className={accent}>&gt;</span>{' '}
          <TerminalReveal mode="type" text="scanning_skills.exe" as="span" />
        </h2>
        <p className={`mb-12 font-mono text-sm ${muted}`}>
          <span className='opacity-60'>$</span> initializing skill matrix...
        </p>

        <div className='space-y-12'>
          {groups.map((group) => (
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
                      key={skill.name}
                      name={skill.name}
                      icon={skill.icon}
                      brandColor={skill.brandColor}
                      proficiency={skill.proficiency}
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
  icon,
  brandColor,
  proficiency,
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
          <TechIcon icon={icon} size={14} className={`shrink-0 ${iconColor}`} brandColor={brandColor} />
          {name}
        </span>
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
