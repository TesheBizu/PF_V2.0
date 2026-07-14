import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import ThemeToggle from '../ui/ThemeToggle'

const NAV_ITEMS = [
  { label: '~/home', href: '#home' },
  { label: 'whoami', href: '#about' },
  { label: 'skills --list', href: '#skills' },
  { label: 'ls projects/', href: '#projects' },
  { label: 'git log', href: '#experience' },
  { label: 'cat reviews.log', href: '#testimonials' },
  { label: './connect.sh', href: '#contact' },
]

const SECTION_IDS = NAV_ITEMS.map((item) => item.href.slice(1))

export default function Navbar() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'

  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')

  const headerRef = useRef(null)

  // Solid/blurred background once scrolled (or when the mobile menu is open)
  const solid = scrolled || open

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Track the section currently in view to highlight its nav link
  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      Boolean,
    )
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  // Close the mobile menu on outside click
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const shell = isMatrix
    ? solid
      ? 'bg-bg-void/85 backdrop-blur-md border-b border-matrix-green/20'
      : 'bg-transparent border-b border-transparent'
    : solid
      ? 'bg-bluepill-bg/85 backdrop-blur-md border-b border-bluepill-accent/20'
      : 'bg-transparent border-b border-transparent'

  const activeCls = isMatrix
    ? 'text-matrix-green underline decoration-matrix-green/70 underline-offset-4'
    : 'text-bluepill-accent underline decoration-bluepill-accent/70 underline-offset-4'
  const inactiveCls = isMatrix
    ? 'text-text-primary/70 hover:text-matrix-green'
    : 'text-bluepill-text/70 hover:text-bluepill-accent'

  const linkClass = (id) =>
    `font-mono text-sm transition-colors ${active === id ? activeCls : inactiveCls}`

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${shell}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        {/* desktop nav */}
        <nav className="hidden items-center gap-5 sm:flex">
          {NAV_ITEMS.map((item) => {
            const id = item.href.slice(1)
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active === id ? 'true' : undefined}
                className={linkClass(id)}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* right: theme toggle (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={`sm:hidden inline-flex h-9 w-9 items-center justify-center rounded border transition-colors ${
              isMatrix
                ? 'border-matrix-green/40 text-matrix-green hover:bg-matrix-green/10'
                : 'border-bluepill-accent/40 text-bluepill-accent hover:bg-bluepill-accent/10'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {open ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile slide-down panel */}
      {open && (
        <div
          className={`sm:hidden border-t ${
            isMatrix ? 'border-matrix-green/20 bg-bg-void/95' : 'border-bluepill-accent/20 bg-bluepill-bg/95'
          } backdrop-blur-md`}
        >
          <div className="px-6 pt-3">
            <ThemeToggle />
          </div>
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-3">
            {NAV_ITEMS.map((item) => {
              const id = item.href.slice(1)
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active === id ? 'true' : undefined}
                  className={`py-2 ${linkClass(id)}`}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
