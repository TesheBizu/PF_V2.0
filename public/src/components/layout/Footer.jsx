import { useTheme } from '../../context/ThemeContext'
import { GitHubIcon, LinkedInIcon, TwitterIcon } from '../ui/icons'

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/example', Icon: GitHubIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/example', Icon: LinkedInIcon },
  { label: 'Twitter / X', href: 'https://x.com/example', Icon: TwitterIcon },
]

const NAV = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
]

export default function Footer() {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const year = new Date().getFullYear()

  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'
  const linkColor = isMatrix
    ? 'text-text-primary/70 hover:text-matrix-green'
    : 'text-bluepill-text/70 hover:text-bluepill-accent'
  const socialColor = isMatrix
    ? 'text-text-primary/60 hover:text-matrix-green'
    : 'text-bluepill-text/60 hover:text-bluepill-accent'
  const glow = isMatrix ? 'via-matrix-green/40' : 'via-bluepill-accent/40'
  const statusColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'

  return (
    <footer className="relative px-6 py-8">
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${glow} to-transparent`}
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-4">
        {/* social links — left on desktop */}
        <div className="order-2 flex items-center gap-4 sm:order-1">
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className={`transition-colors ${socialColor}`}
            >
              <Icon />
            </a>
          ))}
        </div>

        {/* quick nav — center */}
        <nav className="order-1 flex flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-xs sm:order-2">
          {NAV.map(({ label, href }) => (
            <a key={label} href={href} className={`transition-colors ${linkColor}`}>
              {label}
            </a>
          ))}
        </nav>

        {/* copyright + status — right on desktop */}
        <div className="order-3 flex flex-col items-center gap-1 font-mono text-xs sm:items-end">
          <p className={muted}>© {year} Your Name. All rights reserved.</p>
          <p className={`flex items-center gap-2 ${muted}`}>
            <span
              className="status-dot inline-block h-2 w-2 rounded-full bg-matrix-green"
              aria-hidden="true"
            />
            System status: <span className={statusColor}>Online</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
