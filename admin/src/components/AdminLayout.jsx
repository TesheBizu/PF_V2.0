import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from './ThemeToggle'
import MatrixRain from './MatrixRain'
import api from '../lib/api'
import socket from '../lib/socket'
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  Briefcase,
  Quote,
  MessageSquare,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/skills', label: 'Skills', icon: Wrench },
  { to: '/admin/experience', label: 'Experience', icon: Briefcase },
  { to: '/admin/testimonials', label: 'Testimonials', icon: Quote },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/settings', label: 'Site Settings', icon: Settings },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/account', label: 'Account / 2FA', icon: Shield },
]

const ROUTE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/projects': 'Projects',
  '/admin/skills': 'Skills',
  '/admin/experience': 'Experience',
  '/admin/testimonials': 'Testimonials',
  '/admin/messages': 'Messages',
  '/admin/settings': 'Site Settings',
  '/admin/analytics': 'Analytics',
  '/admin/account': 'Account / 2FA Settings',
}

function getPageTitle(pathname) {
  return ROUTE_TITLES[pathname] || 'Admin'
}

export default function AdminLayout() {
  const { logout } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isMatrix = theme === 'matrix'

  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    socket.connect()

    const fetchCount = () => {
      api
        .get('/messages/unread-count')
        .then((res) => setUnreadCount(res.data.count))
        .catch(() => {})
    }

    fetchCount()

    socket.on('messages:created', (msg) => {
      if (msg.status === 'unread') {
        setUnreadCount((c) => c + 1)
      }
    })

    socket.on('messages:updated', (msg) => {
      fetchCount()
    })

    socket.on('messages:deleted', () => {
      fetchCount()
    })

    return () => {
      socket.off('messages:created')
      socket.off('messages:updated')
      socket.off('messages:deleted')
      socket.disconnect()
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const pageTitle = getPageTitle(location.pathname)

  const sidebarBg = isMatrix ? 'bg-bg-void/90' : 'bg-white'
  const sidebarBorder = isMatrix ? 'border-matrix-green/15' : 'border-gray-200'
  const logoCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const linkCls = isMatrix
    ? 'text-matrix-dim hover:text-matrix-green hover:bg-matrix-green/5'
    : 'text-gray-500 hover:text-bluepill-accent hover:bg-bluepill-accent/5'
  const linkActiveCls = isMatrix
    ? 'text-matrix-green bg-matrix-green/10 border-r-2 border-matrix-green'
    : 'text-bluepill-accent bg-bluepill-accent/10 border-r-2 border-bluepill-accent'
  const headerBg = isMatrix ? 'bg-bg-void/90' : 'bg-white/80'
  const headerBorder = isMatrix ? 'border-matrix-green/15' : 'border-gray-200'
  const headerTitleCls = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const emailCls = isMatrix ? 'text-matrix-dim' : 'text-gray-400'
  const logoutCls = isMatrix
    ? 'text-matrix-dim hover:text-alert'
    : 'text-gray-400 hover:text-alert'
  const contentBg = isMatrix ? 'bg-bg-void/90' : 'bg-bluepill-bg'
  const contentText = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const hamburgerCls = isMatrix
    ? 'text-matrix-dim hover:text-matrix-green'
    : 'text-gray-400 hover:text-bluepill-accent'
  const overlayBg = isMatrix ? 'bg-black/60' : 'bg-black/40'

  const sidebarWidth = 'w-64'

  function SidebarContent() {
    return (
      <>
        <div className={`flex items-center gap-2 border-b px-5 py-5 ${sidebarBorder}`}>
          <span className={`font-mono text-base font-bold ${logoCls}`}>PF_V2.0</span>
          <span className={`font-mono text-xs ${isMatrix ? 'text-matrix-dim' : 'text-gray-400'}`}>
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `mb-0.5 flex items-center gap-3 rounded-r-sm px-3 py-2.5 font-mono text-sm transition-colors ${
                  isActive ? linkActiveCls : linkCls
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {to === '/admin/messages' && unreadCount > 0 && (
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-mono font-bold leading-none ${isMatrix ? 'bg-alert text-white' : 'bg-red-500 text-white'}`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t px-5 py-4 ${sidebarBorder}`}>
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-r-sm px-3 py-2 font-mono text-sm transition-colors ${logoutCls}`}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <div className={`relative flex h-screen overflow-hidden ${contentBg} ${contentText}`}>
      {isMatrix && <MatrixRain active={isMatrix} />}
      <aside
        className={`relative z-10 hidden lg:flex ${sidebarWidth} shrink-0 flex-col border-r ${sidebarBg} ${sidebarBorder}`}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div
          className={`fixed inset-0 z-40 lg:hidden ${overlayBg}`}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-200 lg:hidden ${sidebarBg} ${sidebarBorder} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-5 ${sidebarBorder}`}>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-base font-bold ${logoCls}`}>PF_V2.0</span>
            <span className={`font-mono text-xs ${isMatrix ? 'text-matrix-dim' : 'text-gray-400'}`}>
              Admin
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className={hamburgerCls}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `mb-0.5 flex items-center gap-3 rounded-r-sm px-3 py-2.5 font-mono text-sm transition-colors ${
                  isActive ? linkActiveCls : linkCls
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {to === '/admin/messages' && unreadCount > 0 && (
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-mono font-bold leading-none ${isMatrix ? 'bg-alert text-white' : 'bg-red-500 text-white'}`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t px-5 py-4 ${sidebarBorder}`}>
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-r-sm px-3 py-2 font-mono text-sm transition-colors ${logoutCls}`}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <header
          className={`flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm sm:px-6 ${headerBorder} ${headerBg}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className={`shrink-0 lg:hidden ${hamburgerCls}`}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className={`truncate font-mono text-base font-semibold ${headerTitleCls}`}>
              {pageTitle}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <span className={`hidden font-mono text-xs sm:inline ${emailCls}`}>
              Signed in as admin
            </span>
            <ThemeToggle />
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 ${contentBg}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
