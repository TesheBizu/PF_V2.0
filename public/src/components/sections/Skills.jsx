import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import api from '../../lib/api'
import socket from '../../lib/socket'
import TerminalReveal from '../ui/TerminalReveal'
import SkillsSphere from './SkillsSphere'

export default function Skills() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'

  const sectionRef = useRef(null)

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
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'

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

        <SkillsSphere skills={skills} loading={loading} />
      </div>
    </section>
  )
}
