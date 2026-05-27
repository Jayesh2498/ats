/**
 * Dashboard — real data for live metrics
 * Route: /dashboard
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CandidateDetailPanel } from '@/components/candidate-detail/CandidateDetailPanel'
import {
  Users, Briefcase, FileText,
  ChevronRight, Plus,
  TrendingDown, TrendingUp, Video, Loader2,
  Clock, Eye, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { mockDb, DEMO_ORG_ID } from '@/lib/mockDb'
import { formatDistanceToNow, differenceInHours } from 'date-fns'
import { AppShell } from '@/components/AppShell'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useJobs } from '@/hooks/useJobLifecycle'
import { useApplicationCounts } from '@/hooks/useApplicationCounts'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useUpcomingInterviews } from '@/hooks/useUpcomingInterviews'

const FORMAT_ICONS: Record<string, string> = {
  video:  '📹',
  phone:  '📞',
  onsite: '🏢',
  async:  '📋',
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { jobs, loading: jobsLoading } = useJobs()
  const { totalCandidates, pendingOffers, loading: countsLoading } = useApplicationCounts()
  const metrics = useDashboardMetrics()
  const { interviews, loading: interviewsLoading } = useUpcomingInterviews()

  // Interview → candidate panel
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.full_name ?? user?.email?.split('@')[0] ?? 'there'

  const openJobs  = jobs.filter(j => j.status === 'published' || j.status === 'open')
  const draftJobs = jobs.filter(j => j.status === 'draft')
  const loading   = jobsLoading || countsLoading
  const jobsWithOpenings = openJobs
    .filter(j => (j.open_positions ?? 1) > 0)
    .sort((a, b) => (b.open_positions ?? 1) - (a.open_positions ?? 1))

  return (
    <AppShell>
      <div className="px-8 py-7 space-y-7">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Overview Dashboard
            </p>
            <h1 className="text-3xl font-black text-foreground">
              {greeting}, {firstName}.
            </h1>
          </div>
          <Link
            to="/jobs/new"
            className="flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)', boxShadow: '4px 4px 10px rgba(64,130,109,0.25),-3px -3px 8px rgba(255,255,255,0.55)' }}
          >
            <Plus className="size-4" /> New Job
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={Briefcase}
            iconBg="bg-viridian-100 text-viridian-600"
            value={loading ? '—' : String(openJobs.length)}
            label="Open Roles"
            sub={!loading && draftJobs.length > 0 ? `${draftJobs.length} draft${draftJobs.length !== 1 ? 's' : ''}` : undefined}
            subColor="bg-gray-100 text-gray-500"
          />
          <StatCard
            icon={Users}
            iconBg="bg-viridian-100 text-viridian-600"
            value={loading ? '—' : String(totalCandidates)}
            label="Active Candidates"
          />
          <StatCard
            icon={FileText}
            iconBg="bg-amber-100 text-amber-600"
            value={loading ? '—' : String(pendingOffers)}
            label="Offers Pending"
            sub={!loading && pendingOffers > 0 ? `${pendingOffers} Critical` : undefined}
            subColor="bg-red-100 text-red-600"
          />
        </div>

        {/* Hires Pending + Upcoming Interviews */}
        <div className="grid grid-cols-2 gap-4">

          {/* Hires Pending */}
          <div className="rounded-2xl border bg-card p-5 flex flex-col"
            style={{ boxShadow: '4px 4px 10px rgba(0,0,0,0.05),-3px -3px 8px rgba(255,255,255,0.65)' }}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <h3 className="font-bold text-foreground">Hires Pending</h3>
                <p className="text-xs text-muted-foreground">Open positions still to be filled</p>
              </div>
              <Link to="/jobs" className="text-sm font-semibold flex items-center gap-1 hover:underline" style={{ color: '#40826D' }}>
                Manage Jobs <ChevronRight className="size-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : jobsWithOpenings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                <p className="text-sm font-semibold text-muted-foreground">All positions filled!</p>
                <p className="text-xs text-muted-foreground mt-1">No open seats remaining</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[260px] pr-0.5">
                {jobsWithOpenings.map(job => {
                  const openings = job.open_positions ?? 1
                  return (
                    <Link key={job.id} to={`/pipeline?job=${job.id}`}
                      className="flex items-center gap-3 rounded-xl border p-3 transition-all"
                      style={{ background: 'hsl(152,14%,96%)', borderColor: 'hsl(150,16%,87%)' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#B0D9CF'; el.style.background = '#EEF6F3'; el.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'hsl(150,16%,87%)'; el.style.background = 'hsl(152,14%,96%)'; el.style.transform = '' }}
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg shrink-0 text-sm" style={{ background: '#D6EDE7' }}>
                        {job.department === 'Engineering' ? '💻' : job.department === 'Design' ? '🎨' : job.department === 'Marketing' ? '📣' : job.department === 'Product' ? '📦' : job.department === 'Sales' ? '💼' : '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#1F2D2A' }}>{job.title}</p>
                        {job.department && <p className="text-xs" style={{ color: '#6B7C77' }}>{job.department}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{ background: '#EEF6F3', color: '#40826D', border: '1px solid #B0D9CF' }}>
                          {openings} open {openings === 1 ? 'seat' : 'seats'}
                        </span>
                        <ChevronRight className="size-3.5" style={{ color: '#6B7C77' }} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Upcoming Interviews */}
          <div className="rounded-2xl border bg-card p-5 flex flex-col"
            style={{ boxShadow: '4px 4px 10px rgba(0,0,0,0.05),-3px -3px 8px rgba(255,255,255,0.65)' }}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">Upcoming Interviews</h3>
                  {!interviewsLoading && interviews.length > 0 && (
                    <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[10px] font-black text-white"
                      style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)' }}>
                      {interviews.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Click any to view candidate profile</p>
              </div>
              <button onClick={() => navigate('/calendar')}
                className="text-sm font-semibold flex items-center gap-1 transition-colors hover:underline shrink-0"
                style={{ color: '#40826D' }}>
                Calendar <ChevronRight className="size-3.5" />
              </button>
            </div>
            {interviewsLoading ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                <div className="flex size-10 items-center justify-center rounded-full mb-2" style={{ background: '#EEF6F3' }}>
                  <Video className="size-4" style={{ color: '#40826D' }} />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No upcoming interviews</p>
                <p className="text-xs text-muted-foreground mt-1">Move candidates to Interview stage to schedule one</p>
              </div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5" style={{ maxHeight: '320px' }}>
                {interviews.map(iv => {
                  const time       = iv.scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  const today      = new Date()
                  const tomorrow   = new Date(Date.now() + 86400000)
                  const isToday    = iv.scheduledAt.toDateString() === today.toDateString()
                  const isTomorrow = iv.scheduledAt.toDateString() === tomorrow.toDateString()
                  const dayLabel   = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : iv.scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  // Initials avatar
                  const initials   = iv.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={iv.id}
                      onClick={() => setSelectedAppId(iv.applicationId)}
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all cursor-pointer"
                      style={{ background: 'hsl(152,14%,96%)', borderColor: isToday ? '#B0D9CF' : 'hsl(150,16%,87%)' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#B0D9CF'; el.style.background = '#EEF6F3'; el.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = isToday ? '#B0D9CF' : 'hsl(150,16%,87%)'; el.style.background = 'hsl(152,14%,96%)'; el.style.transform = '' }}
                    >
                      {/* Avatar */}
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ background: isToday ? 'linear-gradient(135deg,#40826D,#2F6F5E)' : 'linear-gradient(135deg,#7FB5A8,#5A9C87)' }}>
                        {initials}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate leading-tight" style={{ color: '#1F2D2A' }}>{iv.candidateName}</p>
                        <p className="text-[11px] truncate" style={{ color: '#6B7C77' }}>{iv.jobTitle}</p>
                      </div>
                      {/* Date + format */}
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[10px] font-bold"
                          style={{ color: isToday ? '#2F6F5E' : '#6B7C77' }}>
                          {dayLabel}
                        </span>
                        <span className="text-[10px]" style={{ color: '#9BB5AD' }}>{time}</span>
                        <span className="text-[9px] px-1.5 py-px rounded font-semibold"
                          style={{ background: '#D6EDE7', color: '#2F6F5E' }}>
                          {FORMAT_ICONS[iv.format]} {iv.format}
                        </span>
                      </div>
                      <ChevronRight className="size-3.5 shrink-0" style={{ color: '#B0D9CF' }} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Time to Hire */}
          <div className="rounded-2xl border bg-card p-6"
            style={{ boxShadow: '4px 4px 10px rgba(0,0,0,0.05),-3px -3px 8px rgba(255,255,255,0.65)' }}>
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-bold text-foreground">Time to Hire</h3>
                <p className="text-xs text-muted-foreground">Average days to close a role</p>
              </div>
              <div className="text-right">
                {metrics.loading ? (
                  <Loader2 className="size-5 animate-spin ml-auto" style={{ color: '#40826D' }} />
                ) : (
                  <>
                    <p className="text-2xl font-black text-foreground">
                      {metrics.avgDaysToHire !== null ? `${metrics.avgDaysToHire}d` : '—'}
                    </p>
                    {metrics.timeToHireTrend !== null ? (
                      <p className={cn('text-[11px] font-semibold flex items-center gap-1 justify-end', metrics.timeToHireTrend <= 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {metrics.timeToHireTrend <= 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
                        {Math.abs(metrics.timeToHireTrend)}% VS LAST MONTH
                      </p>
                    ) : metrics.hiredCount > 0 ? (
                      <p className="text-[11px] font-semibold flex items-center gap-1 justify-end" style={{ color: '#40826D' }}>
                        {metrics.hiredCount} hired total
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">No hires yet</p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="mt-5 flex items-end gap-2 h-24">
              {metrics.timeToHireHistory.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(h * 80, 4)}px`,
                      background: i === 5 ? 'linear-gradient(180deg,#5A9C87,#40826D)' : 'hsl(150,20%,83%)',
                      boxShadow: i === 5 ? '0 2px 6px rgba(64,130,109,0.3)' : 'none',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {Array.from({ length: 6 }, (_, i) => {
                const d = new Date()
                d.setMonth(d.getMonth() - (5 - i))
                return i === 5 ? 'Now' : d.toLocaleString('default', { month: 'short' })
              }).map((l, i) => (
                <span key={i} className="flex-1 text-center text-[9px]" style={{ color: '#9BB5AD' }}>{l}</span>
              ))}
            </div>
          </div>

          {/* Acceptance Rate */}
          <div className="rounded-2xl border bg-card p-6"
            style={{ boxShadow: '4px 4px 10px rgba(0,0,0,0.05),-3px -3px 8px rgba(255,255,255,0.65)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground">Acceptance Rate</h3>
                <p className="text-xs text-muted-foreground">Offers accepted vs sent</p>
              </div>
              <div className="text-right">
                {metrics.loading ? (
                  <Loader2 className="size-5 animate-spin ml-auto" style={{ color: '#40826D' }} />
                ) : (
                  <>
                    <p className="text-2xl font-black text-foreground">
                      {metrics.acceptanceRate !== null ? `${Math.round(metrics.acceptanceRate)}%` : '—'}
                    </p>
                    {metrics.acceptanceTrend !== null ? (
                      <p className={cn('text-[11px] font-semibold flex items-center gap-1 justify-end', metrics.acceptanceTrend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {metrics.acceptanceTrend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {Math.abs(metrics.acceptanceTrend)}% TREND
                      </p>
                    ) : metrics.totalOffers > 0 ? (
                      <p className="text-[11px] font-semibold" style={{ color: '#40826D' }}>
                        {metrics.totalHired}/{metrics.totalOffers} accepted
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">No offers yet</p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center mt-2">
              <div className="relative size-28">
                <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(150,16%,87%)" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="url(#viriGrad)" strokeWidth="10"
                    strokeDasharray={`${((metrics.acceptanceRate ?? 0) / 100) * 251.2} 251.2`}
                    strokeLinecap="round" />
                  <defs>
                    <linearGradient id="viriGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#5A9C87" />
                      <stop offset="100%" stopColor="#2F6F5E" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black" style={{ color: '#40826D' }}>
                    {metrics.acceptanceRate !== null ? `${Math.round(metrics.acceptanceRate)}%` : '—'}
                  </span>
                  <span className="text-[9px] font-semibold mt-0.5" style={{ color: '#6B7C77' }}>
                    {metrics.totalHired}/{metrics.totalOffers}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pending Offer Letters ── */}
        <PendingOffersSection />

      </div>

      {/* Candidate detail panel — opened from interview cards */}
      <CandidateDetailPanel
        applicationId={selectedAppId}
        open={!!selectedAppId}
        onClose={() => setSelectedAppId(null)}
        defaultTab="activity"
      />
    </AppShell>
  )
}

// ── Types ─────────────────────────────────────────────────────

interface PendingOffer {
  id: string
  candidate_name: string
  job_title: string
  salary: string
  start_date: string
  status: string
  expires_at: string
  token: string
  notes: string | null
  company_name: string
  role_type: string
  created_at: string
}

// ── StatusPill ────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    pending:  { label: 'Awaiting Response', bg: 'hsl(43,100%,94%)',  color: '#92400E', icon: <Clock className="size-3" />         },
    accepted: { label: 'Accepted',          bg: 'hsl(141,76%,93%)',  color: '#065F46', icon: <CheckCircle2 className="size-3" />  },
    declined: { label: 'Declined',          bg: 'hsl(0,86%,95%)',    color: '#991B1B', icon: <AlertTriangle className="size-3" /> },
    expired:  { label: 'Expired',           bg: 'hsl(0,0%,93%)',     color: '#6B7280', icon: <AlertTriangle className="size-3" /> },
  }
  const c = cfg[status] ?? cfg.pending
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0"
      style={{ background: c.bg, color: c.color }}>
      {c.icon}{c.label}
    </span>
  )
}

// ── Offer Preview Modal ───────────────────────────────────────

function OfferPreviewModal({ offer, onClose }: { offer: PendingOffer; onClose: () => void }) {
  const previewUrl = `${window.location.origin}/offer/${offer.token}`
  const expiresAt  = new Date(offer.expires_at)
  const hoursLeft  = differenceInHours(expiresAt, new Date())
  const isExpired  = hoursLeft < 0

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'hsl(0,0%,100%)', boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'hsl(150,15%,87%)' }}>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)' }}>
              <FileText className="size-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#1F2D2A' }}>Offer Letter Preview</p>
              <p className="text-[11px]" style={{ color: '#6B7C77' }}>Read-only · {offer.company_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted text-sm"
            style={{ color: '#6B7C77' }}
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-4">
          {/* Candidate + role */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-black" style={{ color: '#1F2D2A' }}>{offer.candidate_name}</p>
              <p className="text-sm font-semibold" style={{ color: '#40826D' }}>{offer.job_title}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7C77' }}>{offer.role_type} · {offer.company_name}</p>
            </div>
            <StatusPill status={offer.status} />
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: 'Compensation', value: offer.salary, danger: false },
              { label: 'Start Date',   value: new Date(offer.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), danger: false },
              { label: 'Offer Sent',   value: formatDistanceToNow(new Date(offer.created_at), { addSuffix: true }), danger: false },
              { label: 'Expires',      value: isExpired ? 'Expired' : `in ${hoursLeft < 24 ? `${hoursLeft}h` : `${Math.floor(hoursLeft / 24)}d`}`, danger: isExpired || hoursLeft < 24 },
            ] as { label: string; value: string; danger: boolean }[]).map(({ label, value, danger }) => (
              <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: 'hsl(150,14%,96%)', border: '1px solid hsl(150,15%,88%)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#6B7C77' }}>{label}</p>
                <p className="text-sm font-bold" style={{ color: danger ? '#DC2626' : '#1F2D2A' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Notes */}
          {offer.notes && (
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'hsl(150,14%,96%)', border: '1px solid hsl(150,15%,88%)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#6B7C77' }}>Additional Notes</p>
              <p className="text-xs leading-relaxed" style={{ color: '#1F2D2A' }}>{offer.notes}</p>
            </div>
          )}

          {/* Preview link — read only */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: 'hsl(162,34%,94%)', border: '1px solid hsl(162,30%,82%)' }}>
            <Eye className="size-3.5 shrink-0" style={{ color: '#40826D' }} />
            <p className="text-xs font-mono truncate flex-1" style={{ color: '#2F6F5E' }}>{previewUrl}</p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all"
              style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)', color: '#fff' }}
            >
              Open
            </a>
          </div>

          {/* Read-only notice */}
          <p className="text-center text-[11px]" style={{ color: '#9BB5AD' }}>
            Preview only — the candidate accepts or declines via the link above.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── PendingOffersSection ──────────────────────────────────────

function PendingOffersSection() {
  const [offers, setOffers]   = useState<PendingOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<PendingOffer | null>(null)

  useEffect(() => {
    import('@/lib/auth').then(({ loadSession }) => {
      const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
      setOffers(mockDb.getOffers(orgId) as unknown as PendingOffer[])
      setLoading(false)
    })
  }, [])

  const pendingCount  = offers.filter(o => o.status === 'pending').length
  const resolvedCount = offers.filter(o => o.status !== 'pending').length

  if (loading) return (
    <div className="rounded-2xl border bg-card p-6 space-y-3"
      style={{ boxShadow: '4px 4px 10px rgba(0,0,0,0.05),-3px -3px 8px rgba(255,255,255,0.65)' }}>
      <div className="h-5 w-40 rounded-lg bg-muted animate-pulse" />
      {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
    </div>
  )

  if (offers.length === 0) return null

  return (
    <>
      <div className="rounded-2xl border bg-card p-6"
        style={{ boxShadow: '4px 4px 10px rgba(0,0,0,0.05),-3px -3px 8px rgba(255,255,255,0.65)' }}>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)' }}>
              <FileText className="size-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Offer Letters</h3>
              <p className="text-xs text-muted-foreground">
                {pendingCount} awaiting response · {resolvedCount} resolved
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: 'hsl(43,100%,94%)', color: '#92400E' }}>
              <Clock className="size-3" /> {pendingCount} pending
            </span>
          )}
        </div>

        {/* Offer rows */}
        <div className="space-y-2.5">
          {offers.map(offer => {
            const expiresAt = new Date(offer.expires_at)
            const hoursLeft = differenceInHours(expiresAt, new Date())
            const isExpired = hoursLeft < 0
            const isUrgent  = !isExpired && hoursLeft < 48 && offer.status === 'pending'
            const isPending = offer.status === 'pending'

            return (
              <div
                key={offer.id}
                className="flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all"
                style={{
                  background: isPending ? 'hsl(152,14%,97%)' : 'hsl(0,0%,99%)',
                  borderColor: isUrgent ? 'hsl(38,92%,80%)' : isPending ? 'hsl(150,16%,87%)' : 'hsl(0,0%,91%)',
                  boxShadow: isUrgent ? '0 0 0 1px hsl(38,92%,80%)' : 'none',
                }}
              >
                {/* Initials avatar */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ background: isPending ? 'linear-gradient(135deg,#40826D,#2F6F5E)' : 'linear-gradient(135deg,#9BB5AD,#7A9E96)' }}>
                  {offer.candidate_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: '#1F2D2A' }}>{offer.candidate_name}</p>
                    <StatusPill status={offer.status} />
                    {isUrgent && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: 'hsl(0,86%,95%)', color: '#991B1B' }}>
                        <AlertTriangle className="size-2.5" /> Expires soon
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs" style={{ color: '#6B7C77' }}>{offer.job_title}</span>
                    <span className="text-[11px] font-semibold" style={{ color: '#40826D' }}>{offer.salary}</span>
                    <span className="text-[11px]" style={{ color: '#6B7C77' }}>
                      Start {new Date(offer.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Expiry time + preview button */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9BB5AD' }}>
                      {offer.status === 'pending' ? 'Expires' : 'Sent'}
                    </p>
                    <p className="text-xs font-bold"
                      style={{ color: isExpired ? '#DC2626' : isUrgent ? '#D97706' : '#6B7C77' }}>
                      {offer.status === 'pending'
                        ? (isExpired ? 'Expired' : formatDistanceToNow(expiresAt, { addSuffix: true }))
                        : formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setPreview(offer)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border"
                    style={{ background: 'hsl(162,34%,94%)', borderColor: 'hsl(162,30%,82%)', color: '#2F6F5E' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(135deg,#40826D,#2F6F5E)'; el.style.color = '#fff'; el.style.borderColor = 'transparent' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'hsl(162,34%,94%)'; el.style.color = '#2F6F5E'; el.style.borderColor = 'hsl(162,30%,82%)' }}
                  >
                    <Eye className="size-3.5" /> Preview
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {preview && <OfferPreviewModal offer={preview} onClose={() => setPreview(null)} />}
    </>
  )
}

// ── StatCard ──────────────────────────────────────────────────

function StatCard({
  icon: Icon, iconBg, value, label, sub, subColor,
}: {
  icon: React.ElementType
  iconBg: string
  value: string
  label: string
  sub?: string
  subColor?: string
}) {
  return (
    <div className="rounded-2xl border bg-card px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-4">
      <div className={cn('flex size-10 items-center justify-center rounded-xl shrink-0', iconBg)}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-3xl font-black text-foreground leading-none">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
      {sub && (
        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0', subColor ?? 'bg-muted text-muted-foreground')}>
          {sub}
        </span>
      )}
    </div>
  )
}
