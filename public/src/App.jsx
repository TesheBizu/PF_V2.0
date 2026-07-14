import { Routes, Route } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import MatrixRain from './components/layout/MatrixRain'
import ThemeToggle from './components/ui/ThemeToggle'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Skills from './components/sections/Skills'
import Projects from './components/sections/Projects'
import Experience from './components/sections/Experience'
import Testimonials from './components/sections/Testimonials'
import Contact from './components/sections/Contact'

function App() {
  const { theme } = useTheme()

  const scrimClass =
    theme === 'matrix'
      ? 'bg-bg-void/85'
      : 'bg-gradient-to-b from-bluepill-bg/85 via-bluepill-bg/90 to-bluepill-bg/90'

  return (
    <>
      <MatrixRain active={theme === 'matrix'} />

      <div className={`relative z-10 ${scrimClass}`}>
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
                <Projects />
                <Experience />
                <Testimonials />
                <Contact />
              </>
            }
          />
        </Routes>
      </div>
    </>
  )
}

export default App
