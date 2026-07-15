import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuthToken } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const pendingToken = searchParams.get('pendingToken')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login?error=google_auth_failed', { replace: true })
      return
    }

    if (pendingToken) {
      navigate('/verify-2fa', { state: { pendingToken }, replace: true })
    } else if (token) {
      setAuthToken(token)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, setAuthToken])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-void">
      <p className="font-mono text-sm text-matrix-dim">{'> processing...'}</p>
    </div>
  )
}
