import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import socket from '../lib/socket'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Eye, EyeOff, Upload } from 'lucide-react'

const VALID_TYPES = ['Work Experience', 'Education', 'Self-Learning']

const EMPTY_FORM = {
  role: '',
  company: '',
  companyUrl: '',
  location: '',
  startDate: '',
  endDate: '',
  ongoing: false,
  type: 'Work Experience',
  description: '',
  logoUrl: '',
  isVisible: true,
  order: 0,
}

export default function ExperienceAdmin() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const fileRef = useRef(null)

  const fetchEntries = () => {
    setLoading(true)
    api
      .get('/experience/all')
      .then((res) => setEntries(res.data))
      .catch(() => toast.error('Failed to load experience entries.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('experience:created', (entry) => {
      setEntries((prev) => {
        if (prev.some((e) => e._id === entry._id)) return prev
        return [...prev, entry]
      })
    })

    socket.on('experience:updated', (entry) => {
      setEntries((prev) =>
        prev.map((e) => (e._id === entry._id ? entry : e)),
      )
    })

    socket.on('experience:deleted', ({ id }) => {
      setEntries((prev) => prev.filter((e) => e._id !== id))
    })

    socket.on('experience:reordered', (list) => {
      setEntries(list)
    })

    return () => {
      socket.off('experience:created')
      socket.off('experience:updated')
      socket.off('experience:deleted')
      socket.off('experience:reordered')
      socket.disconnect()
    }
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setLogoFile(null)
    setLogoPreview(null)
    setFormOpen(true)
  }

  const openEdit = (e) => {
    setEditingId(e._id)
    const hasEnd = !!e.endDate
    setForm({
      role: e.role,
      company: e.company,
      companyUrl: e.companyUrl || '',
      location: e.location,
      startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : '',
      endDate: hasEnd ? new Date(e.endDate).toISOString().slice(0, 10) : '',
      ongoing: !hasEnd,
      type: VALID_TYPES.includes(e.type) ? e.type : 'Work Experience',
      description: (e.description || []).join('\n'),
      logoUrl: e.logoUrl || '',
      isVisible: e.isVisible,
      order: e.order,
    })
    setLogoFile(null)
    setLogoPreview(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setLogoFile(null)
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(null)
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(URL.createObjectURL(file))
  }

  const removeLogo = () => {
    setLogoFile(null)
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(null)
    setForm((f) => ({ ...f, logoUrl: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.role.trim() || !form.company.trim() || !form.location.trim() || !form.startDate) {
      return toast.error('Role, company, location, and start date are required.')
    }
    setSaving(true)
    try {
      let logoUrl = form.logoUrl || null

      if (logoFile) {
        const fd = new FormData()
        fd.append('file', logoFile)
        fd.append('folder', 'portfolio/experience')
        const res = await api.post('/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        logoUrl = res.data.url
      }

      const endDate = form.ongoing ? null : (form.endDate || null)

      const payload = {
        role: form.role,
        company: form.company,
        companyUrl: form.companyUrl || null,
        logoUrl,
        location: form.location,
        startDate: form.startDate,
        endDate,
        type: form.type,
        description: form.description,
        isVisible: form.isVisible,
        order: form.order,
      }

      if (editingId) {
        await api.put(`/experience/${editingId}`, payload)
        toast.success('Experience entry updated.')
      } else {
        await api.post('/experience', payload)
        toast.success('Experience entry created.')
      }
      closeForm()
      fetchEntries()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save experience entry.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/experience/${id}`)
      toast.success('Experience entry deleted.')
      setDeleteConfirm(null)
      fetchEntries()
    } catch {
      toast.error('Failed to delete experience entry.')
    }
  }

  const handleReorder = async (id, newOrder) => {
    try {
      await api.patch(`/experience/${id}/reorder`, { order: newOrder })
      fetchEntries()
    } catch {
      toast.error('Failed to reorder.')
    }
  }

  const moveUp = (idx) => {
    if (idx === 0) return
    const cur = entries[idx]
    const prev = entries[idx - 1]
    handleReorder(cur._id, prev.order - 1)
  }

  const moveDown = (idx) => {
    if (idx === entries.length - 1) return
    const cur = entries[idx]
    const next = entries[idx + 1]
    handleReorder(cur._id, next.order + 1)
  }

  const fmtDateShort = (d) => {
    if (!d) return 'Present'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const headingCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subtextCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const cardCls = isMatrix
    ? 'border-matrix-green/15 bg-bg-void/80'
    : 'border-gray-200 bg-white'
  const inputCls = isMatrix
    ? 'border-matrix-green/20 bg-bg-void text-matrix-green placeholder:text-matrix-dim/50 focus:border-matrix-green/50'
    : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-bluepill-accent/50'
  const btnCls = isMatrix
    ? 'border-matrix-green/40 bg-matrix-green/10 text-matrix-green hover:bg-matrix-green/20'
    : 'border-bluepill-accent/40 bg-bluepill-accent/10 text-bluepill-accent hover:bg-bluepill-accent/20'
  const iconCls = isMatrix
    ? 'text-matrix-green/60 hover:text-matrix-green'
    : 'text-gray-400 hover:text-bluepill-accent'
  const dangerCls = isMatrix
    ? 'border-alert/40 bg-alert/10 text-alert hover:bg-alert/20'
    : 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
  const badgeGreen = isMatrix
    ? 'border-matrix-green/30 text-matrix-green bg-matrix-green/10'
    : 'border-green-300 text-green-700 bg-green-50'
  const badgeDim = isMatrix
    ? 'border-matrix-dim/30 text-matrix-dim bg-matrix-dim/10'
    : 'border-gray-300 text-gray-500 bg-gray-50'
  const overlayCls = isMatrix ? 'bg-black/60' : 'bg-black/40'
  const modalCls = isMatrix
    ? 'border-matrix-green/20 bg-bg-void'
    : 'border-gray-200 bg-white'
  const typeBadgeCls = isMatrix
    ? 'border-matrix-green/20 text-matrix-green/70 bg-matrix-green/5'
    : 'border-gray-300 text-gray-500 bg-gray-50'

  const hasLogo = logoPreview || form.logoUrl

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`font-mono text-lg ${headingCls}`}>Experience</h2>
        <button onClick={openCreate} className={`flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-sm transition-colors ${btnCls}`}>
          <Plus className="h-4 w-4" /> Add New Entry
        </button>
      </div>

      {loading ? (
        <p className={`font-mono text-sm ${subtextCls}`}>{'> loading experience...'}</p>
      ) : entries.length === 0 ? (
        <p className={`font-mono text-sm ${subtextCls}`}>No experience entries yet. Click "Add New Entry" to create one.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e, idx) => (
            <div key={e._id} className={`relative flex items-center gap-4 rounded border p-4 ${cardCls}`}>
              <div className="flex flex-col gap-1">
                <button onClick={() => moveUp(idx)} disabled={idx === 0} className={`disabled:opacity-20 ${iconCls}`}><ChevronUp className="h-4 w-4" /></button>
                <button onClick={() => moveDown(idx)} disabled={idx === entries.length - 1} className={`disabled:opacity-20 ${iconCls}`}><ChevronDown className="h-4 w-4" /></button>
              </div>

              {e.logoUrl ? (
                <img src={e.logoUrl} alt={e.company} className="h-12 w-12 shrink-0 rounded-full object-cover" />
              ) : (
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-mono ${isMatrix ? 'bg-matrix-green/5 text-matrix-dim' : 'bg-gray-100 text-gray-400'}`}>
                  {e.company.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate font-mono text-sm font-semibold ${isMatrix ? 'text-text-primary' : 'text-gray-900'}`}>{e.role}</span>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] ${typeBadgeCls}`}>{e.type}</span>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] ${e.isVisible ? badgeGreen : badgeDim}`}>
                    {e.isVisible ? 'visible' : 'hidden'}
                  </span>
                </div>
                <p className={`mt-0.5 font-mono text-xs ${isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent/80'}`}>
                  {e.company}{e.location ? ` — ${e.location}` : ''}
                </p>
                <p className={`mt-0.5 font-mono text-[11px] ${subtextCls}`}>
                  {fmtDateShort(e.startDate)} — {fmtDateShort(e.endDate)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => openEdit(e)} className={iconCls} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleteConfirm(e._id)} className={iconCls} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>

              {deleteConfirm === e._id && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded" style={{ backdropFilter: 'blur(4px)' }}>
                  <div className={`rounded border p-4 text-center shadow-lg ${modalCls}`}>
                    <p className={`mb-3 font-mono text-sm ${isMatrix ? 'text-text-primary' : 'text-gray-900'}`}>Delete "{e.role} at {e.company}"?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(e._id)} className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${dangerCls}`}>Yes, delete</button>
                      <button onClick={() => setDeleteConfirm(null)} className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${btnCls}`}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 ${overlayCls}`}>
          <div className={`relative mb-10 w-full max-w-lg rounded border p-6 shadow-xl ${modalCls}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`font-mono text-base font-semibold ${headingCls}`}>
                {editingId ? 'Edit Experience' : 'New Experience'}
              </h3>
              <button onClick={closeForm} className={iconCls}><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Role / Title *</label>
                <input
                  value={form.role}
                  onChange={(ev) => setForm((f) => ({ ...f, role: ev.target.value }))}
                  className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="e.g. Senior Frontend Engineer"
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Company / School *</label>
                <input
                  value={form.company}
                  onChange={(ev) => setForm((f) => ({ ...f, company: ev.target.value }))}
                  className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="e.g. Nexus Labs"
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Company / School URL</label>
                <input
                  value={form.companyUrl}
                  onChange={(ev) => setForm((f) => ({ ...f, companyUrl: ev.target.value }))}
                  className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Period</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`mb-1 block font-mono text-[11px] ${subtextCls}`}>Start date *</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(ev) => setForm((f) => ({ ...f, startDate: ev.target.value }))}
                      className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block font-mono text-[11px] ${subtextCls}`}>End date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      disabled={form.ongoing}
                      onChange={(ev) => setForm((f) => ({ ...f, endDate: ev.target.value }))}
                      className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${form.ongoing ? 'opacity-40' : ''} ${inputCls}`}
                    />
                  </div>
                </div>
                <label className="mt-2 flex items-center gap-2 font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={form.ongoing}
                    onChange={(ev) => setForm((f) => ({ ...f, ongoing: ev.target.checked, endDate: '' }))}
                    className={`accent-current ${isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'}`}
                  />
                  Currently ongoing
                </label>
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Location *</label>
                <input
                  value={form.location}
                  onChange={(ev) => setForm((f) => ({ ...f, location: ev.target.value }))}
                  className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="e.g. Remote"
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Type *</label>
                <select
                  value={form.type}
                  onChange={(ev) => setForm((f) => ({ ...f, type: ev.target.value }))}
                  className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                >
                  {VALID_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Description (one bullet per line)</label>
                <textarea
                  value={form.description}
                  onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
                  rows={4}
                  className={`w-full resize-none rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="Led migration of the legacy dashboard to a React + TypeScript SPA."
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Logo / Icon</label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} className="hidden" />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`flex items-center gap-2 rounded border border-dashed px-3 py-3 font-mono text-xs transition-colors ${inputCls}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {form.logoUrl && !logoFile ? 'Replace image' : 'Choose image'}
                  </button>
                  {hasLogo && (
                    <div className="flex items-center gap-2">
                      <img src={logoPreview || form.logoUrl} alt="Logo preview" className="h-10 w-10 rounded-full object-cover" />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className={`font-mono text-[11px] ${subtextCls} hover:text-alert`}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 font-mono text-sm">
                  <input
                    type="checkbox"
                    checked={form.isVisible}
                    onChange={(ev) => setForm((f) => ({ ...f, isVisible: ev.target.checked }))}
                    className={`accent-current ${isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'}`}
                  />
                  {form.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className={`h-3.5 w-3.5 ${subtextCls}`} />}
                  Visible
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className={`flex-1 rounded border px-4 py-2 font-mono text-sm transition-colors disabled:opacity-50 ${btnCls}`}>
                  {saving ? '> saving...' : editingId ? '> update entry' : '> create entry'}
                </button>
                <button type="button" onClick={closeForm} className={`rounded border px-4 py-2 font-mono text-sm transition-colors ${isMatrix ? 'border-matrix-dim/30 text-matrix-dim hover:text-matrix-green' : 'border-gray-300 text-gray-500 hover:text-gray-700'}`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
