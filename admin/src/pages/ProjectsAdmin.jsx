import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import socket from '../lib/socket'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Star, Eye, EyeOff, Upload } from 'lucide-react'

const EMPTY_FORM = {
  title: '',
  description: '',
  techStack: [],
  thumbnailUrl: '',
  githubUrl: '',
  liveUrl: '',
  featured: false,
  isVisible: true,
  order: 0,
}

export default function ProjectsAdmin() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [techInput, setTechInput] = useState('')
  const [thumbFile, setThumbFile] = useState(null)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const fileRef = useRef(null)

  const fetchProjects = () => {
    setLoading(true)
    api
      .get('/projects/all')
      .then((res) => setProjects(res.data))
      .catch(() => toast.error('Failed to load projects.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('projects:created', (project) => {
      setProjects((prev) => {
        if (prev.some((p) => p._id === project._id)) return prev
        return [...prev, project]
      })
    })

    socket.on('projects:updated', (project) => {
      setProjects((prev) =>
        prev.map((p) => (p._id === project._id ? project : p)),
      )
    })

    socket.on('projects:deleted', ({ id }) => {
      setProjects((prev) => prev.filter((p) => p._id !== id))
    })

    socket.on('projects:reordered', (list) => {
      setProjects(list)
    })

    return () => {
      socket.off('projects:created')
      socket.off('projects:updated')
      socket.off('projects:deleted')
      socket.off('projects:reordered')
      socket.disconnect()
    }
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setTechInput('')
    setThumbFile(null)
    setThumbPreview(null)
    setFormOpen(true)
  }

  const openEdit = (p) => {
    setEditingId(p._id)
    setForm({
      title: p.title,
      description: p.description,
      techStack: [...p.techStack],
      thumbnailUrl: p.thumbnailUrl || '',
      githubUrl: p.githubUrl || '',
      liveUrl: p.liveUrl || '',
      featured: p.featured,
      isVisible: p.isVisible,
      order: p.order,
    })
    setTechInput('')
    setThumbFile(null)
    setThumbPreview(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setTechInput('')
    setThumbFile(null)
    if (thumbPreview) URL.revokeObjectURL(thumbPreview)
    setThumbPreview(null)
  }

  const addTech = () => {
    const t = techInput.trim()
    if (t && !form.techStack.includes(t)) {
      setForm((f) => ({ ...f, techStack: [...f.techStack, t] }))
    }
    setTechInput('')
  }

  const removeTech = (t) => {
    setForm((f) => ({ ...f, techStack: f.techStack.filter((x) => x !== t) }))
  }

  const handleThumbChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file)
    if (thumbPreview) URL.revokeObjectURL(thumbPreview)
    setThumbPreview(URL.createObjectURL(file))
  }

  const removeThumb = () => {
    setThumbFile(null)
    if (thumbPreview) URL.revokeObjectURL(thumbPreview)
    setThumbPreview(null)
    setForm((f) => ({ ...f, thumbnailUrl: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error('Title and description are required.')
    }
    setSaving(true)
    try {
      let thumbnailUrl = form.thumbnailUrl || null

      if (thumbFile) {
        const fd = new FormData()
        fd.append('file', thumbFile)
        fd.append('folder', 'portfolio/projects')
        const res = await api.post('/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        thumbnailUrl = res.data.url
      }

      const payload = {
        title: form.title,
        description: form.description,
        techStack: form.techStack,
        thumbnailUrl,
        githubUrl: form.githubUrl,
        liveUrl: form.liveUrl,
        featured: form.featured,
        isVisible: form.isVisible,
        order: form.order,
      }

      if (editingId) {
        await api.put(`/projects/${editingId}`, payload)
        toast.success('Project updated.')
      } else {
        await api.post('/projects', payload)
        toast.success('Project created.')
      }
      closeForm()
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted.')
      setDeleteConfirm(null)
      fetchProjects()
    } catch {
      toast.error('Failed to delete project.')
    }
  }

  const handleReorder = async (id, newOrder) => {
    try {
      await api.patch(`/projects/${id}/reorder`, { order: newOrder })
      fetchProjects()
    } catch {
      toast.error('Failed to reorder.')
    }
  }

  const moveUp = (idx) => {
    if (idx === 0) return
    const cur = projects[idx]
    const prev = projects[idx - 1]
    handleReorder(cur._id, prev.order - 1)
  }

  const moveDown = (idx) => {
    if (idx === projects.length - 1) return
    const cur = projects[idx]
    const next = projects[idx + 1]
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

  const hasThumb = thumbPreview || form.thumbnailUrl

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`font-mono text-lg ${headingCls}`}>Projects</h2>
        <button onClick={openCreate} className={`flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-sm transition-colors ${btnCls}`}>
          <Plus className="h-4 w-4" /> Add New Project
        </button>
      </div>

      {loading ? (
        <p className={`font-mono text-sm ${subtextCls}`}>{'> loading projects...'}</p>
      ) : projects.length === 0 ? (
        <p className={`font-mono text-sm ${subtextCls}`}>No projects yet. Click "Add New Project" to create one.</p>
      ) : (
        <div className="space-y-3">
          {projects.map((p, idx) => (
            <div key={p._id} className={`relative flex items-center gap-4 rounded border p-4 ${cardCls}`}>
              <div className="flex flex-col gap-1">
                <button onClick={() => moveUp(idx)} disabled={idx === 0} className={`disabled:opacity-20 ${iconCls}`}><ChevronUp className="h-4 w-4" /></button>
                <button onClick={() => moveDown(idx)} disabled={idx === projects.length - 1} className={`disabled:opacity-20 ${iconCls}`}><ChevronDown className="h-4 w-4" /></button>
              </div>

              {p.thumbnailUrl ? (
                <img src={p.thumbnailUrl} alt={p.title} className="h-14 w-14 shrink-0 rounded object-cover" />
              ) : (
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded text-xs font-mono ${isMatrix ? 'bg-matrix-green/5 text-matrix-dim' : 'bg-gray-100 text-gray-400'}`}>
                  no img
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate font-mono text-sm font-semibold ${isMatrix ? 'text-text-primary' : 'text-gray-900'}`}>{p.title}</span>
                  {p.featured && <Star className={`h-3.5 w-3.5 shrink-0 ${isMatrix ? 'text-matrix-green fill-matrix-green' : 'text-yellow-500 fill-yellow-500'}`} />}
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${p.isVisible ? badgeGreen : badgeDim}`}>
                    {p.isVisible ? 'visible' : 'hidden'}
                  </span>
                </div>
                <p className={`mt-0.5 truncate font-mono text-xs ${subtextCls}`}>{p.description}</p>
                {p.techStack.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p.techStack.map((t) => (
                      <span key={t} className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${badgeDim}`}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => openEdit(p)} className={iconCls} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleteConfirm(p._id)} className={iconCls} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>

              {deleteConfirm === p._id && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded" style={{ backdropFilter: 'blur(4px)' }}>
                  <div className={`rounded border p-4 text-center shadow-lg ${modalCls}`}>
                    <p className={`mb-3 font-mono text-sm ${isMatrix ? 'text-text-primary' : 'text-gray-900'}`}>Delete "{p.title}"?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(p._id)} className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${dangerCls}`}>Yes, delete</button>
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
                {editingId ? 'Edit Project' : 'New Project'}
              </h3>
              <button onClick={closeForm} className={iconCls}><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="Project title"
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={`w-full resize-none rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="Project description"
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>tech stack</label>
                <div className="flex gap-2">
                  <input
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech() } }}
                    className={`flex-1 rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                    placeholder="Type a tech name and press Enter"
                  />
                  <button type="button" onClick={addTech} className={`shrink-0 rounded border px-3 py-2 font-mono text-sm transition-colors ${btnCls}`}>Add</button>
                </div>
                {form.techStack.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.techStack.map((t) => (
                      <span key={t} className={`flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs ${badgeDim}`}>
                        {t}
                        <button type="button" onClick={() => removeTech(t)} className="ml-0.5 hover:text-alert"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>GitHub URL</label>
                  <input
                    value={form.githubUrl}
                    onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
                    className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Live URL</label>
                  <input
                    value={form.liveUrl}
                    onChange={(e) => setForm((f) => ({ ...f, liveUrl: e.target.value }))}
                    className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>thumbnail</label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbChange} className="hidden" />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`flex items-center gap-2 rounded border border-dashed px-3 py-3 font-mono text-xs transition-colors ${inputCls}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {form.thumbnailUrl && !thumbFile ? 'Replace image' : 'Choose image'}
                  </button>
                  {hasThumb && (
                    <div className="flex items-center gap-2">
                      <img src={thumbPreview || form.thumbnailUrl} alt="Preview" className="h-14 w-14 rounded object-cover" />
                      <button
                        type="button"
                        onClick={removeThumb}
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
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className={`accent-current ${isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'}`}
                  />
                  <Star className={`h-3.5 w-3.5 ${form.featured ? (isMatrix ? 'text-matrix-green fill-matrix-green' : 'text-yellow-500 fill-yellow-500') : subtextCls}`} />
                  Featured
                </label>
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
                  {saving ? '> saving...' : editingId ? '> update project' : '> create project'}
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
