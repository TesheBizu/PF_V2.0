import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import socket from '../lib/socket'
import {
  FolderKanban,
  Wrench,
  Briefcase,
  Quote,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'

export default function Dashboard() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()
  const navigate = useNavigate()

  const [counts, setCounts] = useState({
    projects: 0,
    skills: 0,
    experience: 0,
    testimonials: 0,
    unreadMessages: 0,
  })
  const [recentMessages, setRecentMessages] = useState([])
  const [health, setHealth] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(true)

  const fetchCounts = () =>
    Promise.all([
      api.get('/projects/all'),
      api.get('/skills/all'),
      api.get('/experience/all'),
      api.get('/testimonials/all'),
      api.get('/messages/unread-count'),
    ])
      .then(([projects, skills, experience, testimonials, unread]) => {
        setCounts({
          projects: projects.data.length,
          skills: skills.data.length,
          experience: experience.data.length,
          testimonials: testimonials.data.length,
          unreadMessages: unread.data.count,
        })
      })
      .catch(() => toast.error('Failed to load dashboard data.'))

  const fetchRecentMessages = () => {
    setMessagesLoading(true)
    api
      .get('/messages')
      .then((res) => setRecentMessages(res.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setMessagesLoading(false))
  }

  const fetchHealth = () =>
    api
      .get('/health')
      .then(() => setHealth(true))
      .catch(() => setHealth(false))

  useEffect(() => {
    setInitialLoading(true)
    Promise.all([fetchCounts(), fetchHealth()]).finally(() =>
      setInitialLoading(false),
    )
    fetchRecentMessages()
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))

    const refetch = () => {
      fetchCounts()
      fetchRecentMessages()
    }

    socket.on('projects:created', refetch)
    socket.on('projects:deleted', refetch)
    socket.on('skills:created', refetch)
    socket.on('skills:deleted', refetch)
    socket.on('experience:created', refetch)
    socket.on('experience:deleted', refetch)
    socket.on('testimonials:created', refetch)
    socket.on('testimonials:deleted', refetch)
    socket.on('messages:created', refetch)
    socket.on('messages:deleted', refetch)

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('projects:created', refetch)
      socket.off('projects:deleted', refetch)
      socket.off('skills:created', refetch)
      socket.off('skills:deleted', refetch)
      socket.off('experience:created', refetch)
      socket.off('experience:deleted', refetch)
      socket.off('testimonials:created', refetch)
      socket.off('testimonials:deleted', refetch)
      socket.off('messages:created', refetch)
      socket.off('messages:deleted', refetch)
      socket.disconnect()
    }
  }, [])

  const headingCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subtextCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const cardCls = isMatrix
    ? 'border-matrix-green/15 bg-bg-surface'
    : 'border-gray-200 bg-white'
  const iconCls = isMatrix
    ? 'text-matrix-green/60 hover:text-matrix-green'
    : 'text-gray-400 hover:text-bluepill-accent'

  const statCards = [
    {
      key: 'projects',
      label: 'Total Projects',
      count: counts.projects,
      icon: FolderKanban,
      to: '/admin/projects',
    },
    {
      key: 'skills',
      label: 'Total Skills',
      count: counts.skills,
      icon: Wrench,
      to: '/admin/skills',
    },
    {
      key: 'experience',
      label: 'Experience Entries',
      count: counts.experience,
      icon: Briefcase,
      to: '/admin/experience',
    },
    {
      key: 'testimonials',
      label: 'Testimonials',
      count: counts.testimonials,
      icon: Quote,
      to: '/admin/testimonials',
    },
    {
      key: 'messages',
      label: 'Unread Messages',
      count: counts.unreadMessages,
      icon: MessageSquare,
      to: '/admin/messages',
    },
  ]

  const truncate = (text, max) =>
    text && text.length > max ? text.slice(0, max) + '...' : (text || '')

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className={`mb-6 font-mono text-lg ${headingCls}`}>Dashboard</h2>

      {initialLoading ? (
        <p className={`font-mono text-sm ${subtextCls}`}>{'> loading stats...'}</p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statCards.map(({ key, label, count, icon: Icon, to }) => (
              <button
                key={key}
                onClick={() => navigate(to)}
                className={`flex items-center gap-3 rounded border p-4 text-left transition-colors hover:opacity-80 ${cardCls}`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded ${
                    isMatrix
                      ? 'bg-matrix-green/10 text-matrix-green'
                      : 'bg-bluepill-accent/10 text-bluepill-accent'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-mono text-xl font-bold ${
                      isMatrix ? 'text-text-primary' : 'text-gray-900'
                    }`}
                  >
                    {count}
                  </p>
                  <p className={`truncate font-mono text-xs ${subtextCls}`}>
                    {label}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`font-mono text-sm font-semibold ${headingCls}`}>
                Recent Messages
              </h3>
              <button
                onClick={() => navigate('/admin/messages')}
                className={`flex items-center gap-1 font-mono text-xs transition-colors ${iconCls}`}
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {messagesLoading ? (
              <p className={`font-mono text-sm ${subtextCls}`}>
                {'> loading messages...'}
              </p>
            ) : recentMessages.length === 0 ? (
              <p className={`font-mono text-sm ${subtextCls}`}>
                No messages yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {recentMessages.map((msg) => {
                  const unread = msg.status === 'unread'
                  const nameCls = unread
                    ? `font-semibold ${
                        isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
                      }`
                    : isMatrix
                      ? 'text-text-primary'
                      : 'text-gray-900'
                  return (
                    <button
                      key={msg._id}
                      onClick={() => navigate('/admin/messages')}
                      className={`flex w-full items-center gap-3 rounded border px-4 py-3 text-left transition-colors hover:opacity-80 ${cardCls} ${
                        unread
                          ? `border-l-2 ${
                              isMatrix
                                ? 'border-l-matrix-green'
                                : 'border-l-bluepill-accent'
                            }`
                          : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`truncate font-mono text-sm ${nameCls}`}>
                            {msg.name}
                          </span>
                          {unread && (
                            <span
                              className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                isMatrix ? 'bg-matrix-green' : 'bg-bluepill-accent'
                              }`}
                            />
                          )}
                        </div>
                        <p
                          className={`mt-0.5 truncate font-mono text-xs ${subtextCls}`}
                        >
                          {truncate(msg.message, 80)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-mono text-xs ${subtextCls}`}
                      >
                        {formatDate(msg.createdAt)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className={`mb-3 font-mono text-sm font-semibold ${headingCls}`}>
              Site Health
            </h3>
            <div className="flex flex-wrap gap-4">
              <div
                className={`flex items-center gap-2 rounded border px-4 py-3 font-mono text-sm ${cardCls}`}
              >
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    health === null
                      ? 'bg-yellow-400'
                      : health
                        ? isMatrix
                          ? 'bg-matrix-green'
                          : 'bg-green-500'
                        : 'bg-alert'
                  }`}
                />
                <span className={isMatrix ? 'text-text-primary' : 'text-gray-900'}>
                  API
                </span>
                <span className={subtextCls}>
                  {health === null
                    ? 'checking...'
                    : health
                      ? 'connected'
                      : 'unreachable'}
                </span>
              </div>

              <div
                className={`flex items-center gap-2 rounded border px-4 py-3 font-mono text-sm ${cardCls}`}
              >
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    socketConnected
                      ? isMatrix
                        ? 'bg-matrix-green'
                        : 'bg-green-500'
                      : 'bg-alert'
                  }`}
                />
                <span className={isMatrix ? 'text-text-primary' : 'text-gray-900'}>
                  Socket.IO
                </span>
                <span className={subtextCls}>
                  {socketConnected ? 'connected' : 'disconnected'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
