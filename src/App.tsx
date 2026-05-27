import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

// Public pages
import AuthPage from '@/pages/AuthPage'
import OfferAcceptance from '@/pages/OfferAcceptance'
import ApplyPage from '@/pages/ApplyPage'
import AuthReset from '@/pages/AuthReset'
import NotFound from '@/pages/NotFound'

// App pages (protected)
import Dashboard from '@/pages/Dashboard'
import Jobs from '@/pages/Jobs'
import CreateJob from '@/pages/CreateJob'
import Pipeline from '@/pages/Pipeline'
import Workflows from '@/pages/Workflows'
import EmailTemplateManager from '@/pages/EmailTemplateManager'
import EmailPreview from '@/pages/EmailPreview'
import AdminUsers from '@/pages/AdminUsers'
import Settings from '@/pages/Settings'
import Library from '@/pages/Library'
import CalendarPage from '@/pages/Calendar'





function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// ── App routes ────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Auth — redirect to dashboard if already logged in */}
      <Route path="/" element={<GuestOnly><AuthPage /></GuestOnly>} />

      {/* Legacy /app alias */}
      <Route path="/app" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes — no auth needed */}
      <Route path="/offer/:token"        element={<OfferAcceptance />} />
      <Route path="/apply/:slug"          element={<ApplyPage />} />
      <Route path="/email-preview/:token" element={<EmailPreview />} />

      {/* Dev-only auth reset — no auth guard (used to clear all users) */}
      <Route path="/dev/auth-reset" element={<AuthReset />} />
      {/* Protected app routes */}
      <Route path="/dashboard"             element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/jobs"                  element={<RequireAuth><Jobs /></RequireAuth>} />
      <Route path="/jobs/new"              element={<RequireAuth><CreateJob /></RequireAuth>} />
      <Route path="/jobs/:id/edit"         element={<RequireAuth><CreateJob /></RequireAuth>} />
      <Route path="/calendar"              element={<RequireAuth><CalendarPage /></RequireAuth>} />
      <Route path="/pipeline"              element={<RequireAuth><Pipeline /></RequireAuth>} />
      <Route path="/library"               element={<RequireAuth><Library /></RequireAuth>} />
      <Route path="/workflows"             element={<RequireAuth><Workflows /></RequireAuth>} />
      <Route path="/email-templates"       element={<RequireAuth><EmailTemplateManager /></RequireAuth>} />
      <Route path="/settings"              element={<RequireAuth><Settings /></RequireAuth>} />


      {/* Admin only */}
      <Route path="/admin/users"     element={<RequireAdmin><AdminUsers /></RequireAdmin>} />

      {/* Catch-all */}
      <Route path="/index.html"      element={<Navigate to="/" replace />} />
      <Route path="*"                element={<NotFound />} />
    </Routes>
  )
}

