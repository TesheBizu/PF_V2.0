import { Routes, Route } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import MatrixRain from './components/layout/MatrixRain'
import ThemeToggle from './components/ui/ThemeToggle'

function App() {
  const { theme } = useTheme()

  return (
    <>
      <MatrixRain active={theme === 'matrix'} />

      <div className="relative z-10 min-h-screen">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <div className="flex min-h-screen items-center justify-center p-8">
                <p className="font-mono text-matrix-green">
                  PF_V2.0 — Coming Soon
                </p>
              </div>
            }
          />
        </Routes>
      </div>
    </>
  )
}

export default App
