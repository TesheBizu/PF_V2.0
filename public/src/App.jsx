import { Routes, Route } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import MatrixRain from './components/layout/MatrixRain'
import ThemeToggle from './components/ui/ThemeToggle'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Skills from './components/sections/Skills'

function App() {
  const { theme } = useTheme()

  return (
    <>
      <MatrixRain active={theme === 'matrix'} />

      <div className="relative z-10">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <About />
                <Skills />
              </>
            }
          />
        </Routes>
      </div>
    </>
  )
}

export default App
