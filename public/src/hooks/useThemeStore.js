import { create } from 'zustand'

const useThemeStore = create((set) => ({
  theme: (() => {
    try {
      return localStorage.getItem('pf-theme') || 'matrix'
    } catch {
      return 'matrix'
    }
  })(),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'matrix' ? 'bluepill' : 'matrix'
      try {
        localStorage.setItem('pf-theme', next)
      } catch {}
      return { theme: next }
    }),

  setTheme: (theme) =>
    set(() => {
      try {
        localStorage.setItem('pf-theme', theme)
      } catch {}
      return { theme }
    }),
}))

export default useThemeStore
