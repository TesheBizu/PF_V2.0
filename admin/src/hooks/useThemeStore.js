import { create } from 'zustand'

const useThemeStore = create((set) => ({
  theme: (() => {
    try {
      return localStorage.getItem('pf-admin-theme') || 'matrix'
    } catch {
      return 'matrix'
    }
  })(),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'matrix' ? 'bluepill' : 'matrix'
      try {
        localStorage.setItem('pf-admin-theme', next)
      } catch {}
      return { theme: next }
    }),

  setTheme: (theme) =>
    set(() => {
      try {
        localStorage.setItem('pf-admin-theme', theme)
      } catch {}
      return { theme }
    }),
}))

export default useThemeStore
