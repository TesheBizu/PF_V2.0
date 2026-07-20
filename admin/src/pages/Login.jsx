import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import ThemeToggle from '../components/ThemeToggle'
import MatrixRain from '../components/MatrixRain'

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function Login() {
  const { login, setAuthToken } = useAuth()
  const { theme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const isMatrix = theme === 'matrix'

  useEffect(() => {
    if (searchParams.get('error') === 'google_auth_failed') {
      toast.error('Google authentication failed. The email may not be authorized.')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await login(email, password)
      if (data.twoFactorRequired) {
        navigate('/verify-2fa', { state: { pendingToken: data.token }, replace: true })
      } else {
        setAuthToken(data.token)
        navigate('/admin/dashboard', { replace: true })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }

  const headingCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subtitleCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const labelCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const inputCls = isMatrix
    ? 'border-matrix-green/20 bg-bg-void text-matrix-green placeholder:text-matrix-dim/50 focus:border-matrix-green/50'
    : 'border-bluepill-accent/20 bg-white text-gray-900 placeholder:text-gray-400 focus:border-bluepill-accent/50'
  const eyeCls = isMatrix ? 'text-matrix-dim hover:text-matrix-green' : 'text-gray-400 hover:text-bluepill-accent'
  const submitCls = isMatrix
    ? 'border-matrix-green/40 bg-matrix-green/10 text-matrix-green hover:bg-matrix-green/20'
    : 'border-bluepill-accent/40 bg-bluepill-accent/10 text-bluepill-accent hover:bg-bluepill-accent/20'
  const dividerLineCls = isMatrix ? 'bg-matrix-green/10' : 'bg-gray-200'
  const googleBtnCls = isMatrix
    ? 'border-matrix-green/20 text-matrix-dim hover:border-matrix-green/40 hover:text-matrix-green'
    : 'border-gray-300 text-gray-500 hover:border-bluepill-accent/40 hover:text-bluepill-accent'

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
            <p className={`mt-1 font-mono text-sm ${subtitleCls}`}>admin access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={`mb-1 block font-mono text-xs ${labelCls}`}>
                email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded border px-3 py-2 font-mono text-sm outline-none transition-colors ${inputCls}`}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={`mb-1 block font-mono text-xs ${labelCls}`}>
                password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded border px-3 py-2 pr-9 font-mono text-sm outline-none transition-colors ${inputCls}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${eyeCls}`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded border px-4 py-2 font-mono text-sm transition-colors disabled:opacity-50 ${submitCls}`}
            >
              {loading ? '> authenticating...' : '> login'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className={`h-px flex-1 ${dividerLineCls}`} />
            <span className={`font-mono text-xs ${subtitleCls}`}>or</span>
            <div className={`h-px flex-1 ${dividerLineCls}`} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className={`flex w-full items-center justify-center gap-2 rounded border bg-transparent px-4 py-2 font-mono text-sm transition-colors ${googleBtnCls}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {'> sign in with google'}
          </button>
        </div>
      </div>
    </>
  )
}
