import { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from './context/ThemeContext'
import { useSettings } from './context/SettingsContext'
import useBootSequence from './hooks/useBootSequence'
import { trackEvent } from './lib/analytics'
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

function isVisible(sections, key) {
  if (key === 'hero') return true
  const entry = sections?.find((s) => s.key === key)
  return entry ? entry.isVisible : true
}

function App() {
  const { theme } = useTheme()
  const { settings } = useSettings()
  const { lines, isBooting, skipBoot } = useBootSequence()
  const sections = settings?.sections
  const pageViewTracked = useRef(false)

  useEffect(() => {
    if (!isBooting) return

    const skip = () => skipBoot()

    window.addEventListener('keydown', skip)
    window.addEventListener('click', skip)

    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('click', skip)
    }
  }, [isBooting, skipBoot])

  useEffect(() => {
    if (isBooting || pageViewTracked.current) return
    pageViewTracked.current = true
    trackEvent('page_view')
  }, [isBooting])

  const scrimClass =
    theme === 'matrix'
      ? 'bg-bg-surface/80'
      : 'bg-gradient-to-b from-bluepill-bg/85 via-bluepill-bg/90 to-bluepill-bg/90'

  return (
    <>
      <MatrixRain active={theme === 'matrix'} />

      <AnimatePresence>
        {!isBooting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Navbar />
          </motion.div>
        )}
      </AnimatePresence>

      <InteractiveTerminal />

      <div className={`relative z-10 ${scrimClass}`}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero lines={lines} isBooting={isBooting} />
                {isVisible(sections, 'about') && <About />}
                {isVisible(sections, 'skills') && <Skills />}
                {isVisible(sections, 'github') && <GithubActivity />}
                {isVisible(sections, 'projects') && <Projects />}
                {isVisible(sections, 'experience') && <Experience />}
                {isVisible(sections, 'testimonials') && <Testimonials />}
                {isVisible(sections, 'contact') && <Contact />}
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
