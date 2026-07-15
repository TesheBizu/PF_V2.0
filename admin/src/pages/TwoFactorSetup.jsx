import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../lib/api'

export default function TwoFactorSetup() {
  const { token } = useAuth()
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
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

  const headingCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const subtextCls = isMatrix ? 'text-matrix-dim' : 'text-gray-500'
  const infoBoxCls = isMatrix
    ? 'border-matrix-green/20 bg-bg-void'
    : 'border-gray-200 bg-white'
  const inputCls = isMatrix
    ? 'border-matrix-green/20 bg-bg-void text-matrix-green placeholder:text-matrix-dim/50 focus:border-matrix-green/50'
    : 'border-gray-200 bg-white text-bluepill-text placeholder:text-gray-400 focus:border-bluepill-accent/50'
  const submitCls = isMatrix
    ? 'border-matrix-green/40 bg-matrix-green/10 text-matrix-green hover:bg-matrix-green/20'
    : 'border-bluepill-accent/40 bg-bluepill-accent/10 text-bluepill-accent hover:bg-bluepill-accent/20'

  return (
    <div className="mx-auto max-w-lg">
      <h2 className={`mb-2 font-mono text-lg ${headingCls}`}>2FA Setup</h2>
      <p className={`mb-6 font-mono text-xs ${subtextCls}`}>
        Two-factor authentication adds a second layer of security to your account.
      </p>

      {setupLoading && (
        <p className={`font-mono text-sm ${subtextCls}`}>{'> generating QR code...'}</p>
      )}

      {setupError && (
        <div className="rounded border border-alert/40 bg-alert/10 px-3 py-2 font-mono text-sm text-alert">
          {setupError}
        </div>
      )}

      {success && (
        <div className={`rounded border px-3 py-2 font-mono text-sm ${isMatrix ? 'border-matrix-green/40 bg-matrix-green/10 text-matrix-green' : 'border-bluepill-accent/40 bg-bluepill-accent/10 text-bluepill-accent'}`}>
          2FA has been enabled successfully.
        </div>
      )}

      {qrCode && !success && (
        <>
          <div className={`mb-4 rounded border p-4 text-center ${infoBoxCls}`}>
            <p className={`mb-3 font-mono text-xs ${subtextCls}`}>
              Scan this QR code with Google Authenticator, Authy, or any TOTP app:
            </p>
            <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
          </div>

          {secret && (
            <div className={`mb-4 rounded border px-3 py-2 ${isMatrix ? 'border-matrix-green/10 bg-bg-void' : 'border-gray-200 bg-white'}`}>
              <p className={`mb-1 font-mono text-xs ${subtextCls}`}>
                Or enter this key manually:
              </p>
              <p className={`break-all font-mono text-sm ${headingCls}`}>{secret}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="rounded border border-alert/40 bg-alert/10 px-3 py-2 font-mono text-sm text-alert">
                {error}
              </div>
            )}

            <p className={`font-mono text-xs ${subtextCls}`}>
              After scanning, enter the 6-digit code from your app to confirm setup:
            </p>

            <div>
              <label htmlFor="totp-code" className={`mb-1 block font-mono text-xs ${subtextCls}`}>
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
                className={`w-full rounded border px-3 py-2 text-center font-mono text-2xl tracking-[0.5em] outline-none transition-colors ${inputCls}`}
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className={`w-full rounded border px-4 py-2 font-mono text-sm transition-colors disabled:opacity-50 ${submitCls}`}
            >
              {loading ? '> confirming...' : '> confirm & enable 2fa'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
