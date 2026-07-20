import { useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import ThemeToggle from '../components/ThemeToggle'
import MatrixRain from '../components/MatrixRain'
import api from '../lib/api'

export default function TwoFactorVerify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthToken } = useAuth()
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const pendingToken = location.state?.pendingToken

  if (!pendingToken) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await api.post('/auth/2fa/verify', { token: pendingToken, code })
      setAuthToken(res.data.token)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const headingCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subtitleCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const labelCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const inputCls = isMatrix
    ? 'border-matrix-green/20 bg-bg-void text-matrix-green placeholder:text-matrix-dim/50 focus:border-matrix-green/50'
    : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-bluepill-accent/50'
  const submitCls = isMatrix
    ? 'border-matrix-green/40 bg-matrix-green/10 text-matrix-green hover:bg-matrix-green/20'
    : 'border-bluepill-accent/40 bg-bluepill-accent/10 text-bluepill-accent hover:bg-bluepill-accent/20'
  const backCls = isMatrix
    ? 'text-matrix-dim hover:text-matrix-green'
    : 'text-gray-400 hover:text-bluepill-accent'

  return (
    <>
      <MatrixRain active={isMatrix} />

      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className={`w-full max-w-sm rounded-lg p-6 ${isMatrix ? 'bg-bg-surface' : 'bg-white/85 backdrop-blur-sm'}`}>
          <div className="mb-6 text-center">
            <h1 className={`font-mono text-2xl ${headingCls}`}>PF_V2.0</h1>
            <p className={`mt-1 font-mono text-sm ${subtitleCls}`}>two-factor authentication</p>
          </div>

          <p className={`mb-4 text-center font-mono text-xs ${subtitleCls}`}>
            Enter the 6-digit code from your authenticator app.
          </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label htmlFor="code" className={`mb-1 block font-mono text-xs ${labelCls}`}>
                verification code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`w-full rounded border px-3 py-2 text-center font-mono text-2xl tracking-[0.5em] outline-none transition-colors ${inputCls}`}
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className={`w-full rounded border px-4 py-2 font-mono text-sm transition-colors disabled:opacity-50 ${submitCls}`}
            >
              {loading ? '> verifying...' : '> verify'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className={`mt-4 block w-full text-center font-mono text-xs transition-colors ${backCls}`}
          >
            {'< back to login'}
          </button>
        </div>
      </div>
    </>
  )
}
