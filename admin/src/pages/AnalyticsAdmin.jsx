import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import socket from '../lib/socket'

const RANGE_OPTIONS = [7, 30, 90]

const COLORS = {
  matrix: ['#00ff41', '#00cc34', '#009928', '#00661c', '#003b00', '#33ff66', '#66ff99', '#99ffbb'],
  bluepill: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8', '#1e40af', '#1e3a8a'],
}

export default function AnalyticsAdmin() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()

  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const colors = COLORS[isMatrix ? 'matrix' : 'bluepill']
  const debounceRef = useRef(null)
  const daysRef = useRef(days)

  const fetchSummary = useCallback((d, silent) => {
    if (!silent) setLoading(true)
    api
      .get(`/analytics/summary?days=${d}`)
      .then((res) => setData(res.data))
      .catch(() => { if (!silent) toast.error('Failed to load analytics.') })
      .finally(() => { if (!silent) setLoading(false) })
  }, [])

  useEffect(() => {
    daysRef.current = days
    fetchSummary(days)
  }, [days, fetchSummary])

  useEffect(() => {
    socket.connect()

    const onEvent = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetchSummary(daysRef.current, true)
        debounceRef.current = null
      }, 3000)
    }

    socket.on('analytics:event', onEvent)

    return () => {
      socket.off('analytics:event', onEvent)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      socket.disconnect()
    }
  }, [fetchSummary])

  const headingCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subtextCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const cardCls = isMatrix
    ? 'border-matrix-green/15 bg-bg-surface'
    : 'border-gray-200 bg-white'
  const textCls = isMatrix ? 'text-text-primary' : 'text-gray-900'

  const rangeBtn = (d) => {
    const active = days === d
    const base = isMatrix
      ? 'border-matrix-green/15 text-matrix-dim hover:text-matrix-green'
      : 'border-gray-200 text-gray-500 hover:text-bluepill-accent'
    const activeCls = isMatrix
      ? 'border-matrix-green/40 bg-matrix-green/10 text-matrix-green'
      : 'border-bluepill-accent/40 bg-bluepill-accent/10 text-bluepill-accent'
    return (
      <button
        key={d}
        onClick={() => setDays(d)}
        className={`rounded border px-3 py-2 min-h-[36px] font-mono text-xs transition-colors ${
          active ? activeCls : base
        }`}
      >
        {d}d
      </button>
    )
  }

  const chartText = isMatrix ? '#c8ffc8' : '#1a1a2e'
  const chartGrid = isMatrix ? 'rgba(0,255,65,0.1)' : 'rgba(37,99,235,0.1)'
  const chartBg = isMatrix ? '#0a0e0a' : '#ffffff'
  const tooltipCls = isMatrix
    ? '!border-matrix-green/30 !bg-bg-void !text-text-primary'
    : '!border-gray-200 !bg-white !text-gray-900'

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className={`rounded border px-3 py-2 font-mono text-xs shadow-lg ${tooltipCls}`}>
        <p className="mb-1 font-semibold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }

  const noData = (msg) => (
    <p className={`py-8 text-center font-mono text-sm ${subtextCls}`}>{msg}</p>
  )

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`flex items-center gap-2 font-mono text-lg ${headingCls}`}>
          Analytics
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'
              }`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'
              }`}
            />
          </span>
        </h2>
        <div className="flex gap-2">{RANGE_OPTIONS.map(rangeBtn)}</div>
      </div>

      {loading ? (
        <p className={`font-mono text-sm ${subtextCls}`}>{'> loading analytics...'}</p>
      ) : !data ? (
        <p className={`font-mono text-sm ${subtextCls}`}>No analytics data available.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className={`rounded border p-4 ${cardCls}`}>
              <p className={`font-mono text-2xl font-bold ${textCls}`}>
                {data.totals.totalPageViews}
              </p>
              <p className={`font-mono text-xs ${subtextCls}`}>Total Page Views</p>
            </div>
            <div className={`rounded border p-4 ${cardCls}`}>
              <p className={`font-mono text-2xl font-bold ${textCls}`}>
                {data.totals.uniqueSessions}
              </p>
              <p className={`font-mono text-xs ${subtextCls}`}>Unique Sessions</p>
            </div>
            <div className={`rounded border p-4 ${cardCls}`}>
              <p className={`font-mono text-2xl font-bold ${textCls}`}>
                {data.totals.resumeDownloads}
              </p>
              <p className={`font-mono text-xs ${subtextCls}`}>Resume Downloads</p>
            </div>
          </div>

          <div className={`rounded border p-4 ${cardCls}`}>
            <h3 className={`mb-4 font-mono text-sm font-semibold ${headingCls}`}>
              Views Over Time
            </h3>
            {data.viewsOverTime.length === 0 ? (
              noData('No page view data in this period.')
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="date" tick={{ fill: chartText, fontSize: 11 }} stroke={chartGrid} />
                  <YAxis allowDecimals={false} tick={{ fill: chartText, fontSize: 11 }} stroke={chartGrid} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Page Views"
                    stroke={colors[0]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: colors[0] }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className={`rounded border p-4 ${cardCls}`}>
              <h3 className={`mb-4 font-mono text-sm font-semibold ${headingCls}`}>
                Referrer Breakdown
              </h3>
              {data.referrers.length === 0 ? (
                noData('No referrer data.')
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.referrers.map((r) => ({
                        ...r,
                        name: r.referrer || '(direct)',
                      }))}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {data.referrers.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={`rounded border p-4 ${cardCls}`}>
              <h3 className={`mb-4 font-mono text-sm font-semibold ${headingCls}`}>
                Device Breakdown
              </h3>
              {data.devices.length === 0 ? (
                noData('No device data.')
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.devices.map((d) => ({
                        ...d,
                        name: d.device || '(unknown)',
                      }))}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {data.devices.map((_, i) => (
                        <Cell key={i} fill={colors[(i + 2) % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={`rounded border p-4 ${cardCls}`}>
            <h3 className={`mb-4 font-mono text-sm font-semibold ${headingCls}`}>
              Top Sections by Engagement
            </h3>
            {data.topSections.length === 0 ? (
              noData('No section view data.')
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.topSections} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis type="number" tick={{ fill: chartText, fontSize: 11 }} stroke={chartGrid} />
                  <YAxis
                    type="category"
                    dataKey="section"
                    tick={{ fill: chartText, fontSize: 11 }}
                    stroke={chartGrid}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Views" fill={colors[0]} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`rounded border p-4 ${cardCls}`}>
            <h3 className={`mb-4 font-mono text-sm font-semibold ${headingCls}`}>
              Top Projects by Clicks
            </h3>
            {data.topProjects.length === 0 ? (
              noData('No project click data.')
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.topProjects} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis type="number" tick={{ fill: chartText, fontSize: 11 }} stroke={chartGrid} />
                  <YAxis
                    type="category"
                    dataKey="projectTitle"
                    tick={{ fill: chartText, fontSize: 11 }}
                    stroke={chartGrid}
                    width={120}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Clicks" fill={colors[2]} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className={`rounded border p-4 ${cardCls}`}>
              <h3 className={`mb-4 font-mono text-sm font-semibold ${headingCls}`}>
                Terminal Command Frequency
              </h3>
              {data.commands.length === 0 ? (
                noData('No terminal command data.')
              ) : (
                <div className="space-y-1">
                  {data.commands.map((c, i) => (
                    <div
                      key={c.command}
                      className="flex items-center gap-3 font-mono text-sm"
                    >
                      <span className={`w-6 text-right text-xs ${subtextCls}`}>
                        #{i + 1}
                      </span>
                      <span className={`flex-1 ${textCls}`}>{c.command}</span>
                      <span className={`font-bold ${headingCls}`}>{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`rounded border p-4 ${cardCls}`}>
              <h3 className={`mb-4 font-mono text-sm font-semibold ${headingCls}`}>
                Contact Funnel
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between font-mono text-sm">
                    <span className={textCls}>Contact Section Views</span>
                    <span className={`font-bold ${headingCls}`}>
                      {data.contactFunnel.sectionViews}
                    </span>
                  </div>
                  <div
                    className={`h-3 w-full overflow-hidden rounded-full ${isMatrix ? 'bg-matrix-dim/30' : 'bg-gray-200'}`}
                  >
                    <div
                      className={`h-full rounded-full ${isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'}`}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between font-mono text-sm">
                    <span className={textCls}>Form Submissions</span>
                    <span className={`font-bold ${headingCls}`}>
                      {data.contactFunnel.formSubmits}
                    </span>
                  </div>
                  <div
                    className={`h-3 w-full overflow-hidden rounded-full ${isMatrix ? 'bg-matrix-dim/30' : 'bg-gray-200'}`}
                  >
                    <div
                      className={`h-full rounded-full ${isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'}`}
                      style={{
                        width: `${
                          data.contactFunnel.sectionViews > 0
                            ? (data.contactFunnel.formSubmits / data.contactFunnel.sectionViews) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="border-t pt-4" style={{ borderColor: isMatrix ? 'rgba(0,255,65,0.15)' : 'rgba(37,99,235,0.15)' }}>
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className={textCls}>Conversion Rate</span>
                    <span className={`text-lg font-bold ${headingCls}`}>
                      {data.contactFunnel.conversionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
