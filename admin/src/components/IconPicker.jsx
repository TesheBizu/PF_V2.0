import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { Search, X } from 'lucide-react'
import api from '../lib/api'

export default function IconPicker({ selected, onSelect }) {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'

  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get('/skills/icon-library')
      .then((res) => {
        if (!cancelled) setLibrary(res.data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return library
    return library.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.identifier.toLowerCase().includes(q),
    )
  }, [library, query])

  const inputCls = isMatrix
    ? 'border-matrix-green/20 bg-bg-void text-matrix-green placeholder:text-matrix-dim/50 focus:border-matrix-green/50'
    : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-bluepill-accent/50'

  const itemCls = isMatrix
    ? 'border-matrix-green/15 bg-bg-void/80 hover:border-matrix-green/40 hover:bg-matrix-green/10'
    : 'border-gray-200 bg-white hover:border-bluepill-accent/40 hover:bg-bluepill-accent/5'

  const activeCls = isMatrix
    ? 'border-matrix-green bg-matrix-green/20'
    : 'border-bluepill-accent bg-bluepill-accent/10'

  const subtextCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const textCls = isMatrix ? 'text-matrix-green' : 'text-gray-900'

  return (
    <div>
      <div className='relative mb-3'>
        <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${subtextCls}`} />
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search icons...'
          className={`w-full rounded border py-2 pl-9 pr-3 font-mono text-sm outline-none transition-colors ${inputCls}`}
        />
        {query && (
          <button
            type='button'
            onClick={() => setQuery('')}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${subtextCls}`}
          >
            <X className='h-3.5 w-3.5' />
          </button>
        )}
      </div>

      {selected && (
        <div className={`mb-3 flex items-center gap-3 rounded border p-3 ${isMatrix ? 'border-matrix-green/30 bg-matrix-green/5' : 'border-bluepill-accent/30 bg-bluepill-accent/5'}`}>
          <div
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded'
            style={{ backgroundColor: selected.brandColor + '20' }}
          >
            <div className='h-4 w-4 rounded-full' style={{ backgroundColor: selected.brandColor }} />
          </div>
          <div className='min-w-0 flex-1'>
            <p className={`truncate font-mono text-sm font-semibold ${textCls}`}>{selected.name}</p>
            <p className={`truncate font-mono text-xs ${subtextCls}`}>{selected.identifier}</p>
          </div>
          <span className={`font-mono text-xs ${subtextCls}`}>{selected.brandColor}</span>
        </div>
      )}

      {loading ? (
        <p className={`font-mono text-xs ${subtextCls}`}>Loading icons...</p>
      ) : filtered.length === 0 ? (
        <p className={`font-mono text-xs ${subtextCls}`}>No icons match "{query}".</p>
      ) : (
        <div className='grid max-h-60 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5'>
          {filtered.map((item) => {
            const isActive = selected?.identifier === item.identifier
            return (
              <button
                key={item.identifier}
                type='button'
                onClick={() => onSelect(item)}
                className={`flex flex-col items-center gap-1 rounded border p-2 text-center transition-colors ${isActive ? activeCls : itemCls}`}
              >
                <div
                  className='flex h-7 w-7 items-center justify-center rounded'
                  style={{ backgroundColor: item.brandColor + '20' }}
                >
                  <div className='h-3.5 w-3.5 rounded-full' style={{ backgroundColor: item.brandColor }} />
                </div>
                <span className={`w-full truncate font-mono text-[10px] leading-tight ${textCls}`}>{item.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
