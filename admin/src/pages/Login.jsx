import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, setAuthToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'google_auth_failed') {
      setError('Google authentication failed. The email may not be authorized.')
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(email, password)
      if (data.twoFactorRequired) {
        navigate('/verify-2fa', { state: { pendingToken: data.token }, replace: true })
      } else {
        setAuthToken(data.token)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-void px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-mono text-2xl text-matrix-green">PF_V2.0</h1>
          <p className="mt-1 font-mono text-sm text-matrix-dim">admin access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded border border-alert/40 bg-alert/10 px-3 py-2 font-mono text-sm text-alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block font-mono text-xs text-matrix-dim">
              email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-matrix-green/20 bg-bg-void px-3 py-2 font-mono text-sm text-matrix-green outline-none transition-colors placeholder:text-matrix-dim/50 focus:border-matrix-green/50"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-mono text-xs text-matrix-dim">
              password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-matrix-green/20 bg-bg-void px-3 py-2 font-mono text-sm text-matrix-green outline-none transition-colors placeholder:text-matrix-dim/50 focus:border-matrix-green/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded border border-matrix-green/40 bg-matrix-green/10 px-4 py-2 font-mono text-sm text-matrix-green transition-colors hover:bg-matrix-green/20 disabled:opacity-50"
          >
            {loading ? '> authenticating...' : '> login'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-matrix-green/10" />
          <span className="font-mono text-xs text-matrix-dim">or</span>
          <div className="h-px flex-1 bg-matrix-green/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2 rounded border border-matrix-green/20 bg-bg-void px-4 py-2 font-mono text-sm text-matrix-dim transition-colors hover:border-matrix-green/40 hover:text-matrix-green"
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
  )
}
