import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
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
      </div>
    </div>
  )
}
