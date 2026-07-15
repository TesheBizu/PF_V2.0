import { useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function TwoFactorVerify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthToken } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pendingToken = location.state?.pendingToken

  if (!pendingToken) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/2fa/verify', { token: pendingToken, code })
      setAuthToken(res.data.token)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.'
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
          <p className="mt-1 font-mono text-sm text-matrix-dim">two-factor authentication</p>
        </div>

        <p className="mb-4 text-center font-mono text-xs text-matrix-dim">
          Enter the 6-digit code from your authenticator app.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded border border-alert/40 bg-alert/10 px-3 py-2 font-mono text-sm text-alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="mb-1 block font-mono text-xs text-matrix-dim">
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
              className="w-full rounded border border-matrix-green/20 bg-bg-void px-3 py-2 text-center font-mono text-2xl tracking-[0.5em] text-matrix-green outline-none transition-colors placeholder:text-matrix-dim/50 focus:border-matrix-green/50"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded border border-matrix-green/40 bg-matrix-green/10 px-4 py-2 font-mono text-sm text-matrix-green transition-colors hover:bg-matrix-green/20 disabled:opacity-50"
          >
            {loading ? '> verifying...' : '> verify'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="mt-4 block w-full text-center font-mono text-xs text-matrix-dim transition-colors hover:text-matrix-green"
        >
          {'< back to login'}
        </button>
      </div>
    </div>
  )
}
