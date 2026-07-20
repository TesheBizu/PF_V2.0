import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import socket from '../lib/socket'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Eye, EyeOff, Upload } from 'lucide-react'

const EMPTY_FORM = {
  name: '',
  role: '',
  company: '',
  quote: '',
  linkedinUrl: '',
  isVisible: true,
  order: 0,
}

export default function TestimonialsAdmin() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()

  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const fileRef = useRef(null)

  const fetchTestimonials = () => {
    setLoading(true)
    api
      .get('/testimonials/all')
      .then((res) => setTestimonials(res.data))
      .catch(() => toast.error('Failed to load testimonials.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('testimonials:created', (t) => {
      setTestimonials((prev) => {
        if (prev.some((x) => x._id === t._id)) return prev
        return [...prev, t]
      })
    })

    socket.on('testimonials:updated', (t) => {
      setTestimonials((prev) =>
        prev.map((x) => (x._id === t._id ? t : x)),
      )
    })

    socket.on('testimonials:deleted', ({ id }) => {
      setTestimonials((prev) => prev.filter((x) => x._id !== id))
    })

    socket.on('testimonials:reordered', (list) => {
      setTestimonials(list)
    })

    return () => {
      socket.off('testimonials:created')
      socket.off('testimonials:updated')
      socket.off('testimonials:deleted')
      socket.off('testimonials:reordered')
      socket.disconnect()
    }
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormOpen(true)
  }

  const openEdit = (t) => {
    setEditingId(t._id)
    setForm({
      name: t.name,
      role: t.role,
      company: t.company || '',
      quote: t.quote,
      linkedinUrl: t.linkedinUrl || '',
      isVisible: t.isVisible,
      order: t.order,
    })
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhoto = () => {
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.role.trim() || !form.quote.trim()) {
      return toast.error('Name, role, and quote are required.')
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('role', form.role)
      fd.append('company', form.company)
      fd.append('quote', form.quote)
      fd.append('linkedinUrl', form.linkedinUrl)
      fd.append('isVisible', String(form.isVisible))
      fd.append('order', String(form.order))

      if (photoFile) {
        fd.append('photo', photoFile)
      } else if (editingId && !photoPreview) {
        fd.append('removePhoto', 'true')
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } }

      if (editingId) {
        await api.put(`/testimonials/${editingId}`, fd, config)
        toast.success('Testimonial updated.')
      } else {
        await api.post('/testimonials', fd, config)
        toast.success('Testimonial created.')
      }
      closeForm()
      fetchTestimonials()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save testimonial.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/testimonials/${id}`)
      toast.success('Testimonial deleted.')
      setDeleteConfirm(null)
      fetchTestimonials()
    } catch {
      toast.error('Failed to delete testimonial.')
    }
  }

  const handleReorder = async (id, newOrder) => {
    try {
      await api.patch(`/testimonials/${id}/reorder`, { order: newOrder })
      fetchTestimonials()
    } catch {
      toast.error('Failed to reorder.')
    }
  }

  const moveUp = (idx) => {
    if (idx === 0) return
    const cur = testimonials[idx]
    const prev = testimonials[idx - 1]
    handleReorder(cur._id, prev.order - 1)
  }

  const moveDown = (idx) => {
    if (idx === testimonials.length - 1) return
    const cur = testimonials[idx]
    const next = testimonials[idx + 1]
    handleReorder(cur._id, next.order + 1)
  }

  const headingCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subtextCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const cardCls = isMatrix
    ? 'border-matrix-green/15 bg-bg-surface'
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

  const hasPhoto = photoPreview || (editingId && testimonials.find((t) => t._id === editingId)?.photoUrl)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`font-mono text-lg ${headingCls}`}>Testimonials</h2>
        <button onClick={openCreate} className={`flex items-center gap-2 rounded border px-3 py-2.5 min-h-[44px] font-mono text-sm transition-colors ${btnCls}`}>
          <Plus className="h-4 w-4" /> Add New Testimonial
        </button>
      </div>

      {loading ? (
        <p className={`font-mono text-sm ${subtextCls}`}>{'> loading testimonials...'}</p>
      ) : testimonials.length === 0 ? (
        <p className={`font-mono text-sm ${subtextCls}`}>No testimonials yet. Click "Add New Testimonial" to create one.</p>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t, idx) => (
            <div key={t._id} className={`relative flex items-center gap-4 rounded border p-4 ${cardCls}`}>
              <div className="flex flex-col gap-1">
                <button onClick={() => moveUp(idx)} disabled={idx === 0} className={`disabled:opacity-20 ${iconCls}`}><ChevronUp className="h-4 w-4" /></button>
                <button onClick={() => moveDown(idx)} disabled={idx === testimonials.length - 1} className={`disabled:opacity-20 ${iconCls}`}><ChevronDown className="h-4 w-4" /></button>
              </div>

              {t.photoUrl ? (
                <img src={t.photoUrl} alt={t.name} className="h-14 w-14 shrink-0 rounded-full object-cover" />
              ) : (
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xs font-mono ${isMatrix ? 'bg-matrix-green/5 text-matrix-dim' : 'bg-gray-100 text-gray-400'}`}>
                  no img
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate font-mono text-sm font-semibold ${isMatrix ? 'text-text-primary' : 'text-gray-900'}`}>{t.name}</span>
                  <span className={`truncate font-mono text-xs ${subtextCls}`}>{t.role}{t.company ? ` @ ${t.company}` : ''}</span>
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${t.isVisible ? badgeGreen : badgeDim}`}>
                    {t.isVisible ? 'visible' : 'hidden'}
                  </span>
                </div>
                <p className={`mt-0.5 truncate font-mono text-xs ${subtextCls}`}>&ldquo;{t.quote}&rdquo;</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => openEdit(t)} className={`p-2 ${iconCls}`} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleteConfirm(t._id)} className={`p-2 ${iconCls}`} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>

              {deleteConfirm === t._id && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded" style={{ backdropFilter: 'blur(4px)' }}>
                  <div className={`rounded border p-4 text-center shadow-lg ${modalCls}`}>
                    <p className={`mb-3 font-mono text-sm ${isMatrix ? 'text-text-primary' : 'text-gray-900'}`}>Delete &ldquo;{t.name}&rdquo;?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(t._id)} className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${dangerCls}`}>Yes, delete</button>
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
                {editingId ? 'Edit Testimonial' : 'New Testimonial'}
              </h3>
              <button onClick={closeForm} className={iconCls}><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>role *</label>
                  <input
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                    placeholder="Job title"
                    required
                  />
                </div>
                <div>
                  <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>company</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                    placeholder="Company (optional)"
                  />
                </div>
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>quote *</label>
                <textarea
                  value={form.quote}
                  onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                  rows={4}
                  className={`w-full resize-none rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="What they said..."
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>LinkedIn URL</label>
                <input
                  value={form.linkedinUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                  className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>photo</label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`flex items-center gap-2 rounded border border-dashed px-3 py-3 font-mono text-xs transition-colors ${inputCls}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {hasPhoto && !photoFile ? 'Replace image' : 'Choose image'}
                  </button>
                  {hasPhoto && (
                    <div className="flex items-center gap-2">
                      <img
                        src={photoPreview || testimonials.find((t) => t._id === editingId)?.photoUrl}
                        alt="Preview"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
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
                    onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
                    className={`accent-current ${isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'}`}
                  />
                  {form.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className={`h-3.5 w-3.5 ${subtextCls}`} />}
                  Visible
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className={`flex-1 rounded border px-4 py-2 font-mono text-sm transition-colors disabled:opacity-50 ${btnCls}`}>
                  {saving ? '> saving...' : editingId ? '> update testimonial' : '> create testimonial'}
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
