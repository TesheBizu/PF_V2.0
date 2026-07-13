import { useTheme } from '../../context/ThemeContext'

export default function TerminalWindow({ title = 'terminal', children, className = '' }) {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'

  const frame = isMatrix
    ? 'border-matrix-green/20 bg-bg-void/80'
    : 'border-bluepill-accent/20 bg-white/80'
  const titleBar = isMatrix
    ? 'border-matrix-green/20 bg-matrix-dim/30'
    : 'border-bluepill-accent/20 bg-bluepill-bg'
  const titleText = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent/50'

  return (
    <div
      className={`w-full max-w-2xl overflow-hidden rounded-lg border font-mono text-sm backdrop-blur-sm ${frame} ${className}`}
    >
      <div className={`flex items-center gap-2 border-b px-4 py-2.5 ${titleBar}`}>
        <span className="h-3 w-3 rounded-full bg-alert" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <span className={`ml-2 text-xs ${titleText}`}>{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
