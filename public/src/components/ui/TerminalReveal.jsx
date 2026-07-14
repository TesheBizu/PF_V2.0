import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

const TYPE_SPEED = 80 // matches Hero's useTypewriter default pacing
const LINE_STAGGER = 180 // within the 150-200ms spec
const LINE_DURATION = 0.4

export default function TerminalReveal({
  mode = 'type',
  text,
  lines,
  as,
  className = '',
  lineClassName = '',
  speed = TYPE_SPEED,
  stagger = LINE_STAGGER,
  cursor = true,
}) {
  const Tag = as || (mode === 'type' ? 'span' : 'div')
  const ref = useRef(null)
  // type-mode elements start empty, so use amount:0 (any pixel) to avoid a
  // zero-area element never satisfying a 0.3 threshold
  const inView = useInView(ref, { once: true, amount: mode === 'type' ? 0 : 0.3 })
  const reduce = useReducedMotion()

  // ---------- mode: "type" (character-by-character) ----------
  const [typed, setTyped] = useState(reduce ? text ?? '' : '')
  const [typing, setTyping] = useState(!reduce && !!text)

  useEffect(() => {
    if (mode !== 'type' || reduce) return
    if (!text) {
      setTyping(false)
      return
    }
    if (!inView) return

    let i = 0
    setTyped('')
    setTyping(true)
    const id = setInterval(() => {
      i += 1
      setTyped(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setTyping(false)
      }
    }, speed)
    return () => clearInterval(id)
  }, [mode, inView, reduce, text, speed])

  if (mode === 'type') {
    return (
      <Tag ref={ref} className={className}>
        {typed}
        {cursor && typing && (
          <span className="cursor-blink" aria-hidden="true">
            ▋
          </span>
        )}
      </Tag>
    )
  }

  // ---------- mode: "lines" (staggered fade-up) ----------
  const lineArr = lines ?? []
  const initial = reduce ? 'show' : 'hidden'
  const animate = reduce ? 'show' : inView ? 'show' : 'hidden'

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : stagger / 1000 } },
  }
  const lineVariant = {
    hidden: { opacity: 0, y: reduce ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : LINE_DURATION } },
  }

  const isList = Tag === 'ul' || Tag === 'ol'

  if (isList) {
    const MotionList = Tag === 'ul' ? motion.ul : motion.ol
    return (
      <MotionList
        ref={ref}
        className={className}
        variants={container}
        initial={initial}
        animate={animate}
      >
        {lineArr.map((line, i) => (
          <motion.li key={i} variants={lineVariant} className={lineClassName}>
            {line}
          </motion.li>
        ))}
      </MotionList>
    )
  }

  return (
    <Tag ref={ref} className={className}>
      <motion.div variants={container} initial={initial} animate={animate}>
        {lineArr.map((line, i) => (
          <motion.div key={i} variants={lineVariant} className={lineClassName}>
            {line}
          </motion.div>
        ))}
      </motion.div>
    </Tag>
  )
}
