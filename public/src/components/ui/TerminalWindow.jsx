import { useTheme } from '../../context/ThemeContext'

export default function TerminalWindow({
  title = 'terminal',
  children,
  className = '',
  interactive = false,
  onMinimize,
  onClose,
  onTitlePointerDown,
  fill = false,
}) {
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'

  const frame = isMatrix
    ? 'border-matrix-green/20 bg-bg-surface/80'
    : 'border-bluepill-accent/20 bg-white/80'
  const titleBar = isMatrix
    ? 'border-matrix-green/20 bg-matrix-dim/30'
    : 'border-bluepill-accent/20 bg-bluepill-bg'
  const titleText = isMatrix ? 'text-matrix-green/50' : 'text-bluepill-accent-dark'
  const closeBtn = isMatrix
    ? 'border-matrix-green/40 text-matrix-green hover:bg-matrix-green/10'
    : 'border-bluepill-accent/40 text-bluepill-accent-dark hover:bg-bluepill-accent/10'

  const frameHover = interactive
    ? isMatrix
      ? 'group-hover:border-matrix-green/60'
      : 'group-hover:border-bluepill-accent/60'
    : ''
  const transition = interactive ? 'transition-colors duration-300' : ''

  return (
    <div
      className={`w-full max-w-2xl overflow-hidden rounded-lg border font-mono text-sm backdrop-blur-sm ${frame} ${transition} ${frameHover} ${fill ? 'flex flex-col' : ''} ${className}`}
    >
      <div
        className={`flex select-none items-center gap-2 border-b px-4 py-2.5 ${titleBar}`}
        onPointerDown={onTitlePointerDown}
      >
        <span className="h-3 w-3 rounded-full bg-alert" />
        {onMinimize ? (
          <button
            type="button"
            onClick={onMinimize}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Minimize terminal"
            className="h-3 w-3 cursor-pointer rounded-full bg-amber-400"
          />
        ) : (
          <span className="h-3 w-3 rounded-full bg-amber-400" />
        )}
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <span className={`ml-2 text-xs ${titleText}`}>{title}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Close terminal"
            className={`ml-auto rounded border px-2 py-0.5 text-sm leading-none ${closeBtn}`}
          >
            ✕
          </button>
        )}
      </div>
      <div className={`p-5 ${fill ? 'flex-1 min-h-0' : ''}`}>{children}</div>
    </div>
  )
}
