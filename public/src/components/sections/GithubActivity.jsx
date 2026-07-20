import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import api from '../../lib/api'
import TerminalReveal from '../ui/TerminalReveal'
import { trackEvent } from '../../lib/analytics'

const CELL = 'h-3 w-3 rounded-[2px] transition-colors'
const LEVEL_EMPTY = {
  matrix: 'bg-matrix-green/10',
  bluepill: 'bg-bluepill-accent/10',
}
const LEVEL_FILLED = {
  matrix: ['bg-matrix-green/25', 'bg-matrix-green/45', 'bg-matrix-green/70', 'bg-matrix-green'],
  bluepill: ['bg-bluepill-accent/25', 'bg-bluepill-accent/45', 'bg-bluepill-accent/70', 'bg-bluepill-accent'],
}

const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function levelClass(level, isMatrix) {
  const key = isMatrix ? 'matrix' : 'bluepill'
  if (level <= 0) return LEVEL_EMPTY[key]
  return LEVEL_FILLED[key][Math.min(level - 1, 3)]
}

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function GithubActivity() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'

  const sectionRef = useRef(null)
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.3 })

  useEffect(() => {
    if (sectionInView) trackEvent('section_view', { section: 'github' })
  }, [sectionInView])

  const [state, setState] = useState({ loading: true, error: false, data: null })
  const [tip, setTip] = useState(null)

  useEffect(() => {
    let alive = true
    api
      .get('/github/contributions')
      .then((r) => {
        if (alive) setState({ loading: false, error: false, data: r.data })
      })
      .catch((err) => {
        console.error('[github] fetch failed:', err.message)
        if (alive) setState({ loading: false, error: true, data: null })
      })
    return () => {
      alive = false
    }
  }, [])

  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'
  const textColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const subColor = isMatrix ? 'text-matrix-green/80' : 'text-bluepill-accent-dark'
  const borderColor = isMatrix ? 'border-matrix-green/30' : 'border-bluepill-accent/30'
  const trackBg = isMatrix ? 'bg-matrix-green/10' : 'bg-bluepill-accent/10'

  // Normalize weeks into 7-row columns aligned by weekday (0=Sun .. 6=Sat)
  const columns = state.data?.weeks.map((week) => {
    const cells = new Array(7).fill(null)
    week.days.forEach((day) => {
      cells[day.weekday] = day
    })
    return cells
  })

  const showSkeleton = state.loading || !columns

  // Placeholder columns for the loading skeleton
  const skeletonColumns = Array.from({ length: 22 }, () => new Array(7).fill(null))

  return (
    <section ref={sectionRef} id="github" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span>{' '}
          <TerminalReveal mode="type" text="git log --graph --all" as="span" />
        </h2>
        <p className={`mb-10 font-mono text-sm ${muted}`}>
          <span className="opacity-60">$</span> visualizing commit frequency over the last
          year...
        </p>

        {state.error ? (
          <div
            className={`flex items-center gap-3 rounded-md border px-4 py-6 font-mono text-sm ${borderColor} ${textColor}`}
          >
            <span className={accent}>!</span>
            <span>Unable to load GitHub activity right now.</span>
          </div>
        ) : (
          <>
            {!state.loading && state.data && (
              <p className={`mb-6 font-mono text-sm ${subColor}`}>
                {state.data.totalContributions.toLocaleString()} contributions in the last
                year
              </p>
            )}

            <div className="overflow-x-auto pb-2">
              <div className="inline-flex gap-2">
                {/* weekday labels */}
                <div className="mr-1 flex flex-col gap-[3px] pt-[1px]">
                  {WEEKDAYS.map((label, i) => (
                    <span
                      key={i}
                      className={`flex h-3 items-center font-mono text-[9px] ${muted}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {(showSkeleton ? skeletonColumns : columns).map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-[3px]">
                    {col.map((day, ri) => {
                      if (!day) {
                        return (
                          <div
                            key={ri}
                            className={`${CELL} ${
                              showSkeleton ? `${trackBg} animate-pulse` : 'bg-transparent'
                            }`}
                          />
                        )
                      }
                      return (
                        <div
                          key={ri}
                          className={`${CELL} ${levelClass(day.level, isMatrix)}`}
                          onMouseEnter={(e) =>
                            setTip({
                              date: day.date,
                              count: day.contributionCount,
                              x: e.clientX,
                              y: e.clientY,
                            })
                          }
                          onMouseMove={(e) =>
                            setTip((t) =>
                              t
                                ? { ...t, x: e.clientX, y: e.clientY }
                                : t,
                            )
                          }
                          onMouseLeave={() => setTip(null)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* legend */}
            <div className={`mt-5 flex items-center gap-2 font-mono text-[10px] ${muted}`}>
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((lvl) => (
                <span key={lvl} className={`h-3 w-3 rounded-[2px] ${levelClass(lvl, isMatrix)}`} />
              ))}
              <span>More</span>
            </div>
          </>
        )}
      </div>

      {/* floating hover tooltip */}
      {tip && (
        <div
          className={`pointer-events-none fixed z-50 -translate-y-full rounded border px-2 py-1 font-mono text-[11px] shadow-lg ${borderColor} ${
            isMatrix
              ? 'border-matrix-green/40 bg-bg-surface text-text-primary'
              : 'border-bluepill-accent/40 bg-white text-bluepill-text'
          }`}
          style={{ left: tip.x + 12, top: tip.y - 8 }}
        >
          <div className="font-semibold">{formatDate(tip.date)}</div>
          <div>
            {tip.count === 0 ? 'No contributions' : `${tip.count} contribution${tip.count === 1 ? '' : 's'}`}
          </div>
        </div>
      )}
    </section>
  )
}
