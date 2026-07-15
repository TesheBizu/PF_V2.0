import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-bg-void">
      <header className="border-b border-matrix-green/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-lg text-matrix-green">PF_V2.0 — admin</h1>
          <button
            onClick={handleLogout}
            className="font-mono text-sm text-matrix-dim transition-colors hover:text-matrix-green"
          >
            {'> logout'}
          </button>
        </div>
      </header>

      <main className="p-6">
        <p className="font-mono text-sm text-matrix-dim">{'> dashboard — coming soon'}</p>
      </main>
    </div>
  )
}
