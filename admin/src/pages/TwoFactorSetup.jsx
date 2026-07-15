import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function TwoFactorSetup() {
  const { token } = useAuth()
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(true)
  const [setupError, setSetupError] = useState('')

  useEffect(() => {
    if (!token) return

    let cancelled = false
    setSetupLoading(true)

    api
      .post('/auth/2fa/setup')
      .then((res) => {
        if (!cancelled) {
          setQrCode(res.data.qrCode)
          setSecret(res.data.secret)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSetupError('Failed to generate 2FA setup. Please try again.')
        }
      })
      .finally(() => {
        if (!cancelled) setSetupLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/2fa/verify-setup', { code })
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) return null

  return (
    <div className="mx-auto max-w-lg p-6">
      <h2 className="mb-2 font-mono text-lg text-matrix-green">2FA Setup</h2>
      <p className="mb-6 font-mono text-xs text-matrix-dim">
        Two-factor authentication adds a second layer of security to your account.
      </p>

      {setupLoading && (
        <p className="font-mono text-sm text-matrix-dim">{'> generating QR code...'}</p>
      )}

      {setupError && (
        <div className="rounded border border-alert/40 bg-alert/10 px-3 py-2 font-mono text-sm text-alert">
          {setupError}
        </div>
      )}

      {success && (
        <div className="rounded border border-matrix-green/40 bg-matrix-green/10 px-3 py-2 font-mono text-sm text-matrix-green">
          2FA has been enabled successfully.
        </div>
      )}

      {qrCode && !success && (
        <>
          <div className="mb-4 rounded border border-matrix-green/20 bg-bg-void p-4 text-center">
            <p className="mb-3 font-mono text-xs text-matrix-dim">
              Scan this QR code with Google Authenticator, Authy, or any TOTP app:
            </p>
            <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
          </div>

          {secret && (
            <div className="mb-4 rounded border border-matrix-green/10 bg-bg-void px-3 py-2">
              <p className="mb-1 font-mono text-xs text-matrix-dim">
                Or enter this key manually:
              </p>
              <p className="break-all font-mono text-sm text-matrix-green">{secret}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="rounded border border-alert/40 bg-alert/10 px-3 py-2 font-mono text-sm text-alert">
                {error}
              </div>
            )}

            <p className="font-mono text-xs text-matrix-dim">
              After scanning, enter the 6-digit code from your app to confirm setup:
            </p>

            <div>
              <label htmlFor="totp-code" className="mb-1 block font-mono text-xs text-matrix-dim">
                verification code
              </label>
              <input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
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
              {loading ? '> confirming...' : '> confirm & enable 2fa'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
