export default function TerminalWindow({ title = 'terminal', children, className = '' }) {
  return (
    <div
      className={`w-full max-w-2xl overflow-hidden rounded-lg border border-matrix-green/20 bg-bg-void/80 font-mono text-sm backdrop-blur-sm bluepill:border-bluepill-accent/20 bluepill:bg-white/80 ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-matrix-green/20 bg-matrix-dim/30 px-4 py-2.5 bluepill:border-bluepill-accent/20 bluepill:bg-bluepill-bg">
        <span className="h-3 w-3 rounded-full bg-alert" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <span className="ml-2 text-xs text-matrix-green/50 bluepill:text-bluepill-accent/50">
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
