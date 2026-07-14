import { Routes, Route } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import MatrixRain from './components/layout/MatrixRain'
import Navbar from './components/layout/Navbar'
import InteractiveTerminal from './components/terminal/InteractiveTerminal'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Skills from './components/sections/Skills'
import GithubActivity from './components/sections/GithubActivity'
import Projects from './components/sections/Projects'
import Experience from './components/sections/Experience'
import Testimonials from './components/sections/Testimonials'
import Contact from './components/sections/Contact'
import Footer from './components/layout/Footer'

function App() {
  const { theme } = useTheme()

  const scrimClass =
    theme === 'matrix'
      ? 'bg-bg-void/85'
      : 'bg-gradient-to-b from-bluepill-bg/85 via-bluepill-bg/90 to-bluepill-bg/90'

  return (
    <>
      <MatrixRain active={theme === 'matrix'} />

      <Navbar />

      <InteractiveTerminal />

      <div className={`relative z-10 ${scrimClass}`}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <About />
                <Skills />
                <GithubActivity />
                <Projects />
                <Experience />
                <Testimonials />
                <Contact />
                <Footer />
              </>
            }
          />
        </Routes>
      </div>
    </>
  )
}

export default App
