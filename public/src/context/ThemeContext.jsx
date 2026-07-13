import { createContext, useContext, useEffect } from 'react'
import useThemeStore from '../hooks/useThemeStore'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('matrix', 'bluepill')
    root.classList.add(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
