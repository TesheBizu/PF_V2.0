import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import socket from '../lib/socket'
import {
  Trash2, Archive, CheckCircle, ExternalLink,
} from 'lucide-react'

const STATUS_FILTERS = ['all', 'unread', 'read', 'replied', 'archived']

const STATUS_LABELS = {
  all: 'All',
  unread: 'Unread',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
}

export default function MessagesAdmin() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [savingId, setSavingId] = useState(null)

  const fetchMessages = () => {
    setLoading(true)
    const params = filter === 'all' ? {} : { status: filter }
    api
      .get('/messages', { params })
      .then((res) => setMessages(res.data))
      .catch(() => toast.error('Failed to load messages.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMessages()
  }, [filter])

  useEffect(() => {
    socket.connect()

    socket.on('messages:created', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev
        return [msg, ...prev]
      })
      toast.info(`New message from ${msg.name}`)
    })

    socket.on('messages:updated', (msg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? msg : m)),
      )
    })

    socket.on('messages:deleted', ({ id }) => {
      setMessages((prev) => prev.filter((m) => m._id !== id))
    })

    return () => {
      socket.off('messages:created')
      socket.off('messages:updated')
      socket.off('messages:deleted')
      socket.disconnect()
    }
  }, [])

  const toggleExpand = (msg) => {
    if (expandedId === msg._id) {
      setExpandedId(null)
      return
    }
    setExpandedId(msg._id)
    if (msg.status === 'unread') {
      markAsRead(msg._id)
    }
  }

  const markAsRead = async (id) => {
    setSavingId(id)
    try {
      const { data } = await api.patch(`/messages/${id}/status`, { status: 'read' })
      setMessages((prev) => prev.map((m) => (m._id === id ? data : m)))
    } catch {
    } finally {
      setSavingId(null)
    }
  }

  const updateStatus = async (id, status) => {
    setSavingId(id)
    try {
      const { data } = await api.patch(`/messages/${id}/status`, { status })
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? data : m)).filter(
          (m) => filter === 'all' || m.status === filter,
        ),
      )
      toast.success(`Message marked as ${status}`)
    } catch {
      toast.error('Failed to update message status.')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/messages/${id}`)
      toast.success('Message deleted.')
      if (expandedId === id) setExpandedId(null)
      setDeleteConfirm(null)
    } catch {
      toast.error('Failed to delete message.')
    }
  }

  const getMailtoLink = (msg) => {
    const subject = encodeURIComponent('Re: Your message')
    const body = encodeURIComponent(
      `Hi ${msg.name},\n\n` +
      `Regarding your message:\n\n` +
      `${msg.message}\n\n---\n`,
    )
    return `mailto:${msg.email}?subject=${subject}&body=${body}`
  }

  const headingCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subtextCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const cardCls = isMatrix
    ? 'border-matrix-green/15 bg-bg-void/80'
    : 'border-gray-200 bg-white'
  const iconCls = isMatrix
    ? 'text-matrix-green/60 hover:text-matrix-green'
    : 'text-gray-400 hover:text-bluepill-accent'
  const dangerCls = isMatrix
    ? 'border-alert/40 bg-alert/10 text-alert hover:bg-alert/20'
    : 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
  const btnCls = isMatrix
    ? 'border-matrix-green/40 bg-matrix-green/10 text-matrix-green hover:bg-matrix-green/20'
    : 'border-bluepill-accent/40 bg-bluepill-accent/10 text-bluepill-accent hover:bg-bluepill-accent/20'
  const overlayCls = isMatrix ? 'bg-black/60' : 'bg-black/40'
  const modalCls = isMatrix
    ? 'border-matrix-green/20 bg-bg-void'
    : 'border-gray-200 bg-white'

  const filterBtn = (key) => {
    const active = filter === key
    const base = isMatrix
      ? 'border-matrix-green/15 text-matrix-dim hover:text-matrix-green'
      : 'border-gray-200 text-gray-500 hover:text-bluepill-accent'
    const activeCls = isMatrix
      ? 'border-matrix-green/40 bg-matrix-green/10 text-matrix-green'
      : 'border-bluepill-accent/40 bg-bluepill-accent/10 text-bluepill-accent'
    return (
      <button
        key={key}
        onClick={() => setFilter(key)}
        className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${
          active ? activeCls : base
        }`}
      >
        {STATUS_LABELS[key]}
      </button>
    )
  }

  const statusBadge = (status) => {
    if (status === 'unread') {
      const cls = isMatrix
        ? 'border-matrix-green/40 text-matrix-green bg-matrix-green/15 font-semibold'
        : 'border-bluepill-accent/40 text-bluepill-accent bg-bluepill-accent/10 font-semibold'
      return (
        <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${cls}`}>
          unread
        </span>
      )
    }
    if (status === 'replied') {
      const cls = isMatrix
        ? 'border-matrix-green/30 text-matrix-green bg-matrix-green/10'
        : 'border-green-300 text-green-700 bg-green-50'
      return (
        <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${cls}`}>
          replied
        </span>
      )
    }
    if (status === 'archived') {
      const cls = isMatrix
        ? 'border-matrix-dim/30 text-matrix-dim bg-matrix-dim/10'
        : 'border-gray-300 text-gray-500 bg-gray-50'
      return (
        <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${cls}`}>
          archived
        </span>
      )
    }
    return (
      <span className={`rounded border border-transparent px-1.5 py-0.5 font-mono text-[10px] ${subtextCls}`}>
        read
      </span>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`font-mono text-lg ${headingCls}`}>Messages</h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map(filterBtn)}
      </div>

      {loading ? (
        <p className={`font-mono text-sm ${subtextCls}`}>{'> loading messages...'}</p>
      ) : messages.length === 0 ? (
        <p className={`font-mono text-sm ${subtextCls}`}>No messages yet.</p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const isExpanded = expandedId === msg._id
            const preview = msg.message.length > 100
              ? msg.message.slice(0, 100) + '...'
              : msg.message
            const rowCls = isExpanded
              ? `border-l-2 ${isMatrix ? 'border-matrix-green' : 'border-bluepill-accent'}`
              : ''
            const nameCls = msg.status === 'unread'
              ? `font-semibold ${isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'}`
              : isMatrix ? 'text-text-primary' : 'text-gray-900'

            return (
              <div
                key={msg._id}
                className={`cursor-pointer rounded border p-4 transition-colors ${cardCls} ${rowCls}`}
                onClick={() => toggleExpand(msg)}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`truncate font-mono text-sm ${nameCls}`}>
                        {msg.name}
                      </span>
                      {statusBadge(msg.status)}
                    </div>
                    <p className={`mt-0.5 truncate font-mono text-xs ${subtextCls}`}>
                      {msg.email} &middot; {new Date(msg.createdAt).toLocaleString()}
                    </p>
                    {!isExpanded && (
                      <p className={`mt-1 truncate font-mono text-xs ${subtextCls}`}>
                        {preview}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {savingId === msg._id && (
                      <span className={`font-mono text-[10px] ${subtextCls}`}>saving...</span>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <div className={`rounded border p-3 font-mono text-sm leading-relaxed ${isMatrix ? 'border-matrix-green/10 bg-bg-void text-text-primary' : 'border-gray-100 bg-gray-50 text-gray-900'}`}>
                      {msg.message}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={getMailtoLink(msg)}
                        className={`flex items-center gap-1.5 rounded border px-3 py-1.5 font-mono text-xs transition-colors ${btnCls}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Reply via Email
                      </a>

                      {msg.status !== 'replied' && (
                        <button
                          onClick={() => updateStatus(msg._id, 'replied')}
                          className={`flex items-center gap-1.5 rounded border px-3 py-1.5 font-mono text-xs transition-colors ${btnCls}`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Mark Replied
                        </button>
                      )}

                      {msg.status !== 'archived' && (
                        <button
                          onClick={() => updateStatus(msg._id, 'archived')}
                          className={`flex items-center gap-1.5 rounded border px-3 py-1.5 font-mono text-xs transition-colors ${isMatrix ? 'border-matrix-dim/30 text-matrix-dim hover:text-matrix-green' : 'border-gray-300 text-gray-500 hover:text-bluepill-accent'}`}
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Archive
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirm(msg._id)}
                        className={`flex items-center gap-1.5 rounded border px-3 py-1.5 font-mono text-xs transition-colors ${dangerCls}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>

                    {deleteConfirm === msg._id && (
                      <div className="mt-3">
                        <div className={`rounded border p-3 text-center shadow-lg ${modalCls}`}>
                          <p className={`mb-3 font-mono text-sm ${isMatrix ? 'text-text-primary' : 'text-gray-900'}`}>
                            Permanently delete this message from {msg.name}?
                          </p>
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleDelete(msg._id)}
                              className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${dangerCls}`}
                            >
                              Yes, delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${btnCls}`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
