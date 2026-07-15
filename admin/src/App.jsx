import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import TwoFactorVerify from './pages/TwoFactorVerify'
import Dashboard from './pages/Dashboard'
import ProjectsAdmin from './pages/ProjectsAdmin'
import SkillsAdmin from './pages/SkillsAdmin'
import ExperienceAdmin from './pages/ExperienceAdmin'
import TestimonialsAdmin from './pages/TestimonialsAdmin'
import MessagesAdmin from './pages/MessagesAdmin'
import SiteSettingsAdmin from './pages/SiteSettingsAdmin'
import AnalyticsAdmin from './pages/AnalyticsAdmin'
import TwoFactorSetup from './pages/TwoFactorSetup'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/verify-2fa" element={<TwoFactorVerify />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/projects" element={<ProjectsAdmin />} />
          <Route path="/admin/skills" element={<SkillsAdmin />} />
          <Route path="/admin/experience" element={<ExperienceAdmin />} />
          <Route path="/admin/testimonials" element={<TestimonialsAdmin />} />
          <Route path="/admin/messages" element={<MessagesAdmin />} />
          <Route path="/admin/settings" element={<SiteSettingsAdmin />} />
          <Route path="/admin/analytics" element={<AnalyticsAdmin />} />
          <Route path="/admin/account" element={<TwoFactorSetup />} />
        </Route>
      </Route>

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

export default App
