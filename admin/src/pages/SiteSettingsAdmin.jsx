import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import socket from '../lib/socket'
import {
  ChevronDown, ChevronRight, Plus, X, Upload, Save, Eye, EyeOff,
} from 'lucide-react'

const DEFAULT_SETTINGS = {
  name: '',
  roles: [],
  tagline: '',
  bio: [],
  stats: [],
  profilePhotoUrl: null,
  resumeUrl: null,
  socialLinks: { github: '', linkedin: '', twitter: '' },
  contactEmail: '',
  contactPhone: '',
  contactLocation: '',
  footerCopyrightName: '',
}

const STAT_EMPTY = { label: '', value: 0, suffix: '' }

const SECTIONS = [
  { key: 'hero', label: 'Hero' },
  { key: 'about', label: 'About' },
  { key: 'contactFooter', label: 'Contact & Footer' },
  { key: 'social', label: 'Social Links' },
]

export default function SiteSettingsAdmin() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()

  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.key, true])),
  )
  const [roleInput, setRoleInput] = useState('')
  const [bioInput, setBioInput] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const photoRef = useRef(null)
  const resumeRef = useRef(null)

  const fetchSettings = useCallback(() => {
    setLoading(true)
    api
      .get('/settings')
      .then((res) => {
        const data = { ...DEFAULT_SETTINGS, ...res.data }
        if (res.data.socialLinks) {
          data.socialLinks = { ...DEFAULT_SETTINGS.socialLinks, ...res.data.socialLinks }
        }
        setSettings(data)
      })
      .catch(() => toast.error('Failed to load settings.'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    socket.connect()
    socket.on('settings:updated', (data) => {
      setSettings((prev) => ({ ...prev, ...data }))
    })
    return () => {
      socket.off('settings:updated')
      socket.disconnect()
    }
  }, [])

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const updateSocial = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }))
  }

  const updateSection = (idx, field, value) => {
    const updated = settings.sections.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s,
    )
    updateField('sections', updated)
  }

  const toggleSectionVisibility = (idx) => {
    const current = settings.sections[idx]
    updateSection(idx, 'isVisible', !current.isVisible)
  }

  const addRole = () => {
    const r = roleInput.trim()
    if (r && !settings.roles.includes(r)) {
      updateField('roles', [...settings.roles, r])
    }
    setRoleInput('')
  }

  const removeRole = (idx) => {
    updateField('roles', settings.roles.filter((_, i) => i !== idx))
  }

  const addBio = () => {
    const b = bioInput.trim()
    if (b) {
      updateField('bio', [...settings.bio, b])
    }
    setBioInput('')
  }

  const removeBio = (idx) => {
    updateField('bio', settings.bio.filter((_, i) => i !== idx))
  }

  const addStat = () => {
    updateField('stats', [...settings.stats, { ...STAT_EMPTY }])
  }

  const updateStat = (idx, field, value) => {
    const updated = settings.stats.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s,
    )
    updateField('stats', updated)
  }

  const removeStat = (idx) => {
    updateField('stats', settings.stats.filter((_, i) => i !== idx))
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
    setSettings((prev) => ({ ...prev, profilePhotoUrl: null }))
  }

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      return toast.error('Resume must be a PDF.')
    }
    setResumeFile(file)
  }

  const removeResume = () => {
    setResumeFile(null)
    setSettings((prev) => ({ ...prev, resumeUrl: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', settings.name)
      settings.roles.forEach((r) => fd.append('roles', r))
      fd.append('tagline', settings.tagline)
      settings.bio.forEach((b) => fd.append('bio', b))
      fd.append('stats', JSON.stringify(settings.stats))
      fd.append('socialLinks.github', settings.socialLinks.github)
      fd.append('socialLinks.linkedin', settings.socialLinks.linkedin)
      fd.append('socialLinks.twitter', settings.socialLinks.twitter)
      fd.append('contactEmail', settings.contactEmail)
      fd.append('contactPhone', settings.contactPhone)
      fd.append('contactLocation', settings.contactLocation)
      fd.append('footerCopyrightName', settings.footerCopyrightName)
      fd.append('sections', JSON.stringify(settings.sections))

      if (photoFile) {
        fd.append('profilePhoto', photoFile)
      } else if (!settings.profilePhotoUrl) {
        fd.append('removeProfilePhoto', 'true')
      }
      fd.append('existingProfilePhotoUrl', settings.profilePhotoUrl || '')

      if (resumeFile) {
        fd.append('resume', resumeFile)
      } else if (!settings.resumeUrl) {
        fd.append('removeResume', 'true')
      }
      fd.append('existingResumeUrl', settings.resumeUrl || '')

      await api.put('/settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Settings saved.')
      fetchSettings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
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
  const badgeDim = isMatrix
    ? 'border-matrix-dim/30 text-matrix-dim bg-matrix-dim/10'
    : 'border-gray-300 text-gray-500 bg-gray-50'

  const sectionHeader = (key, label) => (
    <button
      type="button"
      onClick={() => toggleSection(key)}
      className={`flex w-full items-center gap-2 rounded border px-4 py-3 font-mono text-sm transition-colors ${cardCls} ${headingCls}`}
    >
      {expandedSections[key] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      <span>{label}</span>
    </button>
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className={`font-mono text-sm ${subtextCls}`}>{'> loading settings...'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`font-mono text-lg ${headingCls}`}>Site Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============ HERO ============ */}
        {sectionHeader('hero', 'Hero')}
        {expandedSections.hero && (
          <div className={`rounded border p-5 space-y-4 ${cardCls}`}>
            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Name *</label>
              <input
                value={settings.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>
                Roles (typewriter rotation)
              </label>
              <div className="flex gap-2">
                <input
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRole() } }}
                  className={`flex-1 rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="e.g. Full Stack Developer"
                />
                <button type="button" onClick={addRole} className={`shrink-0 rounded border px-3 py-2 font-mono text-sm transition-colors ${btnCls}`}>
                  Add
                </button>
              </div>
              {settings.roles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {settings.roles.map((r, idx) => (
                    <span key={idx} className={`flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs ${badgeDim}`}>
                      {r}
                      <button type="button" onClick={() => removeRole(idx)} className="ml-0.5 hover:text-alert"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Tagline</label>
              <input
                value={settings.tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="Building digital experiences with clean code"
              />
            </div>
          </div>
        )}

        {/* ============ ABOUT ============ */}
        {sectionHeader('about', 'About')}
        {expandedSections.about && (
          <div className={`rounded border p-5 space-y-4 ${cardCls}`}>
            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>
                Bio paragraphs
              </label>
              <div className="flex gap-2">
                <input
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBio() } }}
                  className={`flex-1 rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="Write a paragraph about yourself"
                />
                <button type="button" onClick={addBio} className={`shrink-0 rounded border px-3 py-2 font-mono text-sm transition-colors ${btnCls}`}>
                  Add
                </button>
              </div>
              {settings.bio.length > 0 && (
                <div className="mt-2 space-y-2">
                  {settings.bio.map((b, idx) => (
                    <div key={idx} className={`flex items-start gap-2 rounded border px-3 py-2 ${badgeDim}`}>
                      <span className="flex-1 font-mono text-xs leading-relaxed">{b}</span>
                      <button type="button" onClick={() => removeBio(idx)} className="shrink-0 mt-0.5 hover:text-alert">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={`font-mono text-xs ${subtextCls}`}>Stats blocks</label>
                <button type="button" onClick={addStat} className={`flex items-center gap-1 rounded border px-2 py-1 font-mono text-[11px] transition-colors ${btnCls}`}>
                  <Plus className="h-3 w-3" /> Add Stat
                </button>
              </div>
              <div className="space-y-2">
                {settings.stats.map((s, idx) => (
                  <div key={idx} className={`flex items-center gap-2 rounded border p-2 ${badgeDim}`}>
                    <input
                      value={s.label}
                      onChange={(e) => updateStat(idx, 'label', e.target.value)}
                      className={`flex-1 min-w-0 rounded border px-2 py-1 font-mono text-xs outline-none transition-colors ${inputCls}`}
                      placeholder="Label"
                    />
                    <input
                      type="number"
                      value={s.value}
                      onChange={(e) => updateStat(idx, 'value', Number(e.target.value))}
                      className={`w-20 rounded border px-2 py-1 font-mono text-xs outline-none transition-colors ${inputCls}`}
                      placeholder="0"
                    />
                    <input
                      value={s.suffix}
                      onChange={(e) => updateStat(idx, 'suffix', e.target.value)}
                      className={`w-14 rounded border px-2 py-1 font-mono text-xs outline-none transition-colors ${inputCls}`}
                      placeholder="+"
                    />
                    <button type="button" onClick={() => removeStat(idx)} className="shrink-0 hover:text-alert">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Profile Photo</label>
                <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className={`flex items-center gap-2 rounded border border-dashed px-3 py-3 font-mono text-xs transition-colors ${inputCls}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {settings.profilePhotoUrl && !photoFile ? 'Replace' : 'Choose'}
                  </button>
                  {(photoPreview || settings.profilePhotoUrl) && (
                    <div className="flex items-center gap-2">
                      <img
                        src={photoPreview || settings.profilePhotoUrl}
                        alt="Preview"
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <button type="button" onClick={removePhoto} className={`font-mono text-[11px] ${subtextCls} hover:text-alert`}>Remove</button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Resume (PDF)</label>
                <input ref={resumeRef} type="file" accept="application/pdf" onChange={handleResumeChange} className="hidden" />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => resumeRef.current?.click()}
                    className={`flex items-center gap-2 rounded border border-dashed px-3 py-3 font-mono text-xs transition-colors ${inputCls}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {settings.resumeUrl && !resumeFile ? 'Replace' : 'Choose'}
                  </button>
                  {(resumeFile || settings.resumeUrl) && (
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[11px] ${subtextCls}`}>
                        {resumeFile ? resumeFile.name : 'resume.pdf'}
                      </span>
                      {resumeFile && (
                        <button type="button" onClick={removeResume} className={`font-mono text-[11px] ${subtextCls} hover:text-alert`}>Remove</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ CONTACT & FOOTER ============ */}
        {sectionHeader('contactFooter', 'Contact & Footer')}
        {expandedSections.contactFooter && (
          <div className={`rounded border p-5 space-y-4 ${cardCls}`}>
            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => updateField('contactEmail', e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="hello@example.com"
              />
            </div>
            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>
                Phone Number
                <span className="ml-1.5 opacity-50">(international format)</span>
              </label>
              <input
                value={settings.contactPhone}
                onChange={(e) => updateField('contactPhone', e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="+251912345678"
              />
            </div>
            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Location</label>
              <input
                value={settings.contactLocation}
                onChange={(e) => updateField('contactLocation', e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="Bahir Dar, Ethiopia"
              />
            </div>
            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Footer Copyright Name</label>
              <input
                value={settings.footerCopyrightName}
                onChange={(e) => updateField('footerCopyrightName', e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="Your Name"
              />
            </div>
          </div>
        )}

        {/* ============ NAVIGATION SECTIONS ============ */}
        {sectionHeader('sections', 'Navigation Sections')}
        {expandedSections.sections && (
          <div className={`rounded border p-5 space-y-3 ${cardCls}`}>
            {settings.sections?.length > 0 ? (
              settings.sections.map((s, idx) => (
                <div key={s.key} className="flex items-center gap-3">
                  <span className={`w-24 shrink-0 font-mono text-[11px] uppercase tracking-wider ${subtextCls}`}>
                    {s.key}
                  </span>
                  <input
                    value={s.label}
                    onChange={(e) => updateSection(idx, 'label', e.target.value)}
                    className={`flex-1 rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                    placeholder="Section label"
                  />
                  <button
                    type="button"
                    disabled={s.key === 'hero'}
                    onClick={() => toggleSectionVisibility(idx)}
                    className={`flex h-9 w-9 items-center justify-center rounded border transition-colors ${
                      s.key === 'hero'
                        ? 'opacity-30 cursor-not-allowed'
                        : s.isVisible
                          ? 'border-matrix-green/50 text-matrix-green bg-matrix-green/10'
                          : 'border-gray-400/30 text-gray-400 bg-transparent'
                    }`}
                    title={s.key === 'hero' ? 'Hero is always visible' : s.isVisible ? 'Visible' : 'Hidden'}
                  >
                    {s.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              ))
            ) : (
              <p className={`font-mono text-xs ${subtextCls}`}>No sections configured.</p>
            )}
          </div>
        )}

        {/* ============ SOCIAL LINKS ============ */}
        {sectionHeader('social', 'Social Links')}
        {expandedSections.social && (
          <div className={`rounded border p-5 space-y-4 ${cardCls}`}>
            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>GitHub URL</label>
              <input
                value={settings.socialLinks.github}
                onChange={(e) => updateSocial('github', e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="https://github.com/yourname"
              />
            </div>
            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>LinkedIn URL</label>
              <input
                value={settings.socialLinks.linkedin}
                onChange={(e) => updateSocial('linkedin', e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>
            <div>
              <label className={`mb-1 block font-mono text-xs ${subtextCls}`}>Twitter / X URL</label>
              <input
                value={settings.socialLinks.twitter}
                onChange={(e) => updateSocial('twitter', e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="https://x.com/yourname"
              />
            </div>
          </div>
        )}

        {/* ============ SAVE ============ */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 rounded border px-6 py-2.5 font-mono text-sm transition-colors disabled:opacity-50 ${btnCls}`}
          >
            <Save className="h-4 w-4" />
            {saving ? '> saving...' : '> save settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
