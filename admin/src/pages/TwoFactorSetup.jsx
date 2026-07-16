import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'

export default function TwoFactorSetup() {
  const { token } = useAuth()
  const { theme } = useTheme()
  const isMatrix = theme === 'matrix'
  const toast = useToast()

  const [totpEnabled, setTotpEnabled] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)

  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [code, setCode] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)

  const [disableCode, setDisableCode] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)
  const [disableSuccess, setDisableSuccess] = useState(false)

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    setStatusLoading(true)

    api
      .get('/auth/2fa/status', { signal: controller.signal })
      .then((res) => {
        setTotpEnabled(res.data.totpEnabled)
      })
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setTotpEnabled(null)
          toast.error('Failed to check 2FA status.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatusLoading(false)
      })

    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!token || totpEnabled !== false) return

    const controller = new AbortController()
    setSetupLoading(true)

    api
      .post('/auth/2fa/setup', undefined, { signal: controller.signal })
      .then((res) => {
        setQrCode(res.data.qrCode)
        setSecret(res.data.secret)
      })
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          toast.error('Failed to generate 2FA setup. Please try again.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSetupLoading(false)
      })

    return () => controller.abort()
  }, [token, totpEnabled])

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/auth/2fa/verify-setup', { code })
      setSuccess(true)
      setTotpEnabled(true)
      setDisableSuccess(false)
      toast.success('2FA has been enabled successfully.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async (e) => {
    e.preventDefault()
    setDisableLoading(true)

    try {
      await api.post('/auth/2fa/disable', { code: disableCode })
      setDisableSuccess(true)
      setTotpEnabled(false)
      setQrCode(null)
      setSecret(null)
      setCode('')
      setSuccess(false)
      setDisableCode('')
      toast.success('2FA has been disabled.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to disable 2FA. Please try again.'
      toast.error(msg)
    } finally {
      setDisableLoading(false)
    }
  }

  if (!token || statusLoading || totpEnabled === null) return null

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
  const disableBtnCls = isMatrix
    ? 'border-alert/40 bg-alert/10 text-alert hover:bg-alert/20'
    : 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
  const statusBoxCls = isMatrix
    ? 'border-matrix-green/30 bg-matrix-green/5'
    : 'border-bluepill-accent/20 bg-bluepill-accent/5'

  return (
    <div className="mx-auto max-w-lg">
      <h2 className={`mb-2 font-mono text-lg ${headingCls}`}>2FA Setup</h2>
      <p className={`mb-6 font-mono text-xs ${subtextCls}`}>
        Two-factor authentication adds a second layer of security to your account.
      </p>

      {totpEnabled && !disableSuccess && (
        <div className={`mb-6 rounded border p-4 ${statusBoxCls}`}>
          <div className="mb-3 flex items-center gap-2">
            <span className={`font-mono text-sm font-semibold ${headingCls}`}>
              2FA is currently enabled
            </span>
          </div>
          <p className={`mb-4 font-mono text-xs ${subtextCls}`}>
            Your account is protected with two-factor authentication. Enter your current authenticator code to disable it.
          </p>

          <form onSubmit={handleDisable} className="space-y-3">
            <div>
              <label htmlFor="disable-code" className={`mb-1 block font-mono text-xs ${subtextCls}`}>
                current verification code
              </label>
              <input
                id="disable-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoComplete="one-time-code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`w-full rounded border px-3 py-2 text-center font-mono text-2xl tracking-[0.5em] outline-none transition-colors ${inputCls}`}
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={disableLoading || disableCode.length !== 6}
              className={`w-full rounded border px-4 py-2 font-mono text-sm transition-colors disabled:opacity-50 ${disableBtnCls}`}
            >
              {disableLoading ? '> disabling...' : '> disable 2fa'}
            </button>
          </form>
        </div>
      )}

      {(!totpEnabled || disableSuccess) && (
        <>
          {setupLoading && (
            <p className={`font-mono text-sm ${subtextCls}`}>{'> generating QR code...'}</p>
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
        </>
      )}
    </div>
  )
}
