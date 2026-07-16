import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import socket from '../lib/socket'
import IconPicker from '../components/IconPicker'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Eye, EyeOff } from 'lucide-react'

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'Tools']

const EMPTY_FORM = {
  name: '',
  category: 'Frontend',
  proficiency: 50,
  icon: '',
  brandColor: '',
  isVisible: true,
  order: 0,
}

export default function SkillsAdmin() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()

  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchSkills = () => {
    setLoading(true)
    api
      .get('/skills/all')
      .then((res) => setSkills(res.data))
      .catch(() => toast.error('Failed to load skills.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSkills()
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('skills:created', (skill) => {
      setSkills((prev) => {
        if (prev.some((s) => s._id === skill._id)) return prev
        return [...prev, skill]
      })
    })

    socket.on('skills:updated', (skill) => {
      setSkills((prev) =>
        prev.map((s) => (s._id === skill._id ? skill : s)),
      )
    })

    socket.on('skills:deleted', ({ id }) => {
      setSkills((prev) => prev.filter((s) => s._id !== id))
    })

    socket.on('skills:reordered', (list) => {
      setSkills(list)
    })

    return () => {
      socket.off('skills:created')
      socket.off('skills:updated')
      socket.off('skills:deleted')
      socket.off('skills:reordered')
      socket.disconnect()
    }
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (s) => {
    setEditingId(s._id)
    setForm({
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
      icon: s.icon,
      brandColor: s.brandColor,
      isVisible: s.isVisible,
      order: s.order,
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      return toast.error('Name is required.')
    }
    if (!form.icon || !form.brandColor) {
      return toast.error('Please select an icon.')
    }
    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/skills/${editingId}`, form)
        toast.success('Skill updated.')
      } else {
        await api.post('/skills', form)
        toast.success('Skill created.')
      }
      closeForm()
      fetchSkills()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save skill.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/skills/${id}`)
      toast.success('Skill deleted.')
      setDeleteConfirm(null)
      fetchSkills()
    } catch {
      toast.error('Failed to delete skill.')
    }
  }

  const handleReorder = async (id, newOrder) => {
    try {
      await api.patch(`/skills/${id}/reorder`, { order: newOrder })
      fetchSkills()
    } catch {
      toast.error('Failed to reorder.')
    }
  }

  const moveUp = (idx) => {
    if (idx === 0) return
    const cur = skills[idx]
    const prev = skills[idx - 1]
    handleReorder(cur._id, prev.order - 1)
  }

  const moveDown = (idx) => {
    if (idx === skills.length - 1) return
    const cur = skills[idx]
    const next = skills[idx + 1]
    handleReorder(cur._id, next.order + 1)
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

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`font-mono text-lg ${headingCls}`}>Skills</h2>
        <button onClick={openCreate} className={`flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-sm transition-colors ${btnCls}`}>
          <Plus className="h-4 w-4" /> Add New Skill
        </button>
      </div>

      {loading ? (
        <p className={`font-mono text-sm ${subtextCls}`}>{'> loading skills...'}</p>
      ) : skills.length === 0 ? (
        <p className={`font-mono text-sm ${subtextCls}`}>No skills yet. Click "Add New Skill" to create one.</p>
      ) : (
        <div className="space-y-3">
          {skills.map((s, idx) => (
            <div key={s._id} className={`relative flex items-center gap-4 rounded border p-4 ${cardCls}`}>
              <div className="flex flex-col gap-1">
                <button onClick={() => moveUp(idx)} disabled={idx === 0} className={`disabled:opacity-20 ${iconCls}`}><ChevronUp className="h-4 w-4" /></button>
                <button onClick={() => moveDown(idx)} disabled={idx === skills.length - 1} className={`disabled:opacity-20 ${iconCls}`}><ChevronDown className="h-4 w-4" /></button>
              </div>

              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: s.brandColor + '20' }}
              >
                <div className="h-5 w-5 rounded-full" style={{ backgroundColor: s.brandColor }} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`truncate font-mono text-sm font-semibold ${isMatrix ? 'text-text-primary' : 'text-gray-900'}`}>{s.name}</span>
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${badgeDim}`}>{s.category}</span>
                  <span className={`font-mono text-[10px] ${subtextCls}`}>{s.proficiency}%</span>
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${s.isVisible ? badgeGreen : badgeDim}`}>
                    {s.isVisible ? 'visible' : 'hidden'}
                  </span>
                </div>
                <p className={`mt-0.5 truncate font-mono text-xs ${subtextCls}`}>{s.icon}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => openEdit(s)} className={iconCls} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleteConfirm(s._id)} className={iconCls} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>

              {deleteConfirm === s._id && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded" style={{ backdropFilter: 'blur(4px)' }}>
                  <div className={`rounded border p-4 text-center shadow-lg ${modalCls}`}>
                    <p className={`mb-3 font-mono text-sm ${isMatrix ? 'text-text-primary' : 'text-gray-900'}`}>Delete "{s.name}"?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(s._id)} className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${dangerCls}`}>Yes, delete</button>
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
                {editingId ? 'Edit Skill' : 'New Skill'}
              </h3>
              <button onClick={closeForm} className={iconCls}><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>icon</label>
                <IconPicker
                  selected={form.icon ? { identifier: form.icon, name: form.name, brandColor: form.brandColor } : null}
                  onSelect={(item) => setForm((f) => ({ ...f, icon: item.identifier, brandColor: item.brandColor }))}
                />
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="Skill name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>proficiency (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.proficiency}
                    onChange={(e) => setForm((f) => ({ ...f, proficiency: Number(e.target.value) }))}
                    className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  />
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
                  {saving ? '> saving...' : editingId ? '> update skill' : '> create skill'}
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
