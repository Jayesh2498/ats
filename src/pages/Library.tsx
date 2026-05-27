/**
 * Library — centralized view of Jobs, Candidates, Applications, and Offers
 * Route: /library
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Briefcase, Users, LayoutList, Search, ExternalLink,
  ChevronRight, ChevronDown, Loader2, Filter, X, Sparkles, Phone, Mail,
  MapPin, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle,
  RefreshCw, ArrowRight, CalendarDays, FileText, Send, BadgeCheck,
  Hourglass, Ban, DollarSign, CalendarCheck,
} from 'lucide-react'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { AppShell } from '@/components/AppShell'
import { cn } from '@/lib/utils'
import { mockDb, DEMO_ORG_ID } from '@/lib/mockDb'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getAvatarColor, getInitials } from '@/types/ats'
import { CandidateDetailPanel } from '@/components/candidate-detail/CandidateDetailPanel'

// ── Types ──────────────────────────────────────────────────────

type Tab = 'jobs' | 'candidates' | 'applications' | 'offers'

interface LibJob {
  id: string
  title: string
  department: string | null
  location: string | null
  employment_type: string
  status: string
  created_at: string
  candidate_count?: number
  public_slug: string | null
}

interface LibCandidate {
  id: string
  full_name: string
  email: string
  phone: string | null
  resume_url: string | null
  ai_score: number | null
  created_at: string
  parsed_data: {
    skills?: string[]
    experience_years?: number | null
    summary?: string
  }
}

interface CandidateApplication {
  id: string
  status: string
  ai_score: number | null
  applied_at: string
  updated_at: string
  job: { id: string; title: string; department: string | null } | null
  current_stage: { name: string } | null
}

interface LibApplication {
  id: string
  status: string
  ai_score: number | null
  applied_at: string
  updated_at: string
  candidate: { id: string; full_name: string; email: string } | null
  job: { id: string; title: string; department: string | null } | null
  current_stage: { name: string } | null
}

interface LibOffer {
  id: string
  candidate_name: string
  job_title: string
  salary: string | null
  start_date: string | null
  status: string
  expires_at: string | null
  responded_at: string | null
  created_at: string
  company_name: string | null
  role_type: string | null
  notes: string | null
  token: string
  application_id: string | null
}

// ── Status config ──────────────────────────────────────────────

const APP_STATUS: Record<string, { label: string; icon: React.ReactNode; cls: string; dot: string }> = {
  active:    { label: 'Active',    icon: <Clock className="size-3"      />, cls: 'bg-viridian-50 text-viridian-700 border-viridian-200', dot: 'bg-viridian-500' },
  hired:     { label: 'Hired',     icon: <CheckCircle className="size-3"/>, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',   dot: 'bg-emerald-500'  },
  rejected:  { label: 'Rejected',  icon: <XCircle className="size-3"   />, cls: 'bg-red-50 text-red-700 border-red-200',               dot: 'bg-red-500'      },
  withdrawn: { label: 'Withdrawn', icon: <AlertCircle className="size-3"/>, cls: 'bg-gray-50 text-gray-600 border-gray-200',           dot: 'bg-gray-400'     },
}

const JOB_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  published: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  open:      { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  draft:     { label: 'Draft',  cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400'   },
  closed:    { label: 'Closed', cls: 'bg-gray-50 text-gray-600 border-gray-200',          dot: 'bg-gray-400'    },
}

const GRADE_CLS: Record<string, string> = {
  A: 'bg-viridian-50 text-viridian-600 border-viridian-300',
  B: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  C: 'bg-amber-50 text-amber-700 border-amber-200',
  D: 'bg-red-50 text-red-700 border-red-200',
}

const OFFER_STATUS: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  pending:  { label: 'Pending',  icon: <Hourglass   className="size-3" />, cls: 'bg-amber-50 text-amber-700 border-amber-200'         },
  accepted: { label: 'Accepted', icon: <BadgeCheck  className="size-3" />, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200'    },
  declined: { label: 'Declined', icon: <Ban         className="size-3" />, cls: 'bg-red-50 text-red-700 border-red-200'               },
  expired:  { label: 'Expired',  icon: <AlertCircle className="size-3" />, cls: 'bg-gray-50 text-gray-500 border-gray-200'            },
}

function scoreToGrade(s: number | null): 'A' | 'B' | 'C' | 'D' | null {
  if (s == null) return null
  if (s >= 85) return 'A'
  if (s >= 70) return 'B'
  if (s >= 50) return 'C'
  return 'D'
}

// ── Helper components ─────────────────────────────────────────

function AiScoreBadge({ score }: { score: number | null }) {
  const grade = scoreToGrade(score)
  if (score == null || !grade) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', GRADE_CLS[grade])}>
      <Sparkles className="size-2.5" />{score}%
    </span>
  )
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{sub}</p>
    </div>
  )
}

// ── Jobs Tab ──────────────────────────────────────────────────

function JobsTab({ search, statusFilter }: { search: string; statusFilter: string }) {
  const navigate = useNavigate()
  const [jobs, setJobs]       = useState<LibJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('@/lib/auth').then(({ loadSession }) => {
      const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
      setLoading(true)
      const rawJobs = mockDb.getJobs(orgId)
      const rows: LibJob[] = rawJobs.map(j => ({
        ...j,
        candidate_count: mockDb.getApplications(j.id).length,
      }))
      setJobs(rows)
      setLoading(false)
    })
  }, [])


  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = !search
        || j.title.toLowerCase().includes(search.toLowerCase())
        || (j.department ?? '').toLowerCase().includes(search.toLowerCase())
        || (j.location ?? '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || j.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [jobs, search, statusFilter])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-6 animate-spin text-viridian-600" />
    </div>
  )

  if (!filtered.length) return (
    <EmptyState icon={Briefcase} title="No jobs found" sub="Try adjusting your search or filters." />
  )

  return (
    <div className="space-y-2">
      {filtered.map(job => {
        const jsCfg = JOB_STATUS[job.status] ?? JOB_STATUS.draft
        return (
          <div
            key={job.id}
            className="group flex items-center gap-4 rounded-xl border bg-card px-5 py-4 hover:border-viridian-300 hover:shadow-sm transition-all cursor-pointer"
            onClick={() => navigate(`/pipeline?job=${job.id}`)}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-viridian-100">
              <Briefcase className="size-5 text-viridian-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground leading-tight">{job.title}</p>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', jsCfg.cls)}>
                  <span className={cn('size-1.5 rounded-full', jsCfg.dot)} />{jsCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {job.department && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Briefcase className="size-3 opacity-50" />{job.department}</span>}
                {job.location   && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3 opacity-50" />{job.location}</span>}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3 opacity-50" />{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-lg font-black text-foreground">{job.candidate_count ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Candidates</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Candidates Tab ────────────────────────────────────────────

function CandidatesTab({ search }: { search: string }) {
  const [candidates, setCandidates] = useState<LibCandidate[]>([])
  const [loading, setLoading]       = useState(true)
  const [expandedId, setExpandedId]     = useState<string | null>(null)
  const [appMap, setAppMap]             = useState<Record<string, CandidateApplication[]>>({})
  const [appLoading, setAppLoading]     = useState<string | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)

  useEffect(() => {
    import('@/lib/auth').then(({ loadSession }) => {
      const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
      setLoading(true)
      const apps = mockDb.getAllApplications(orgId)
      const seen = new Set<string>()
      const rows: LibCandidate[] = []
      apps.forEach(a => {
        if (!a.candidate || seen.has(a.candidate.id)) return
        seen.add(a.candidate.id)
        rows.push({
          id:         a.candidate.id,
          full_name:  a.candidate.full_name,
          email:      a.candidate.email,
          phone:      a.candidate.phone,
          resume_url: a.candidate.resume_url,
          ai_score:   (a as unknown as { ai_score?: number | null }).ai_score ?? null,
          created_at: a.candidate.created_at,
          parsed_data: a.candidate.parsed_data,
        })
      })
      setCandidates(rows)
      setLoading(false)
    })
  }, [])


  async function toggleCandidate(candidateId: string) {
    if (expandedId === candidateId) {
      setExpandedId(null)
      return
    }
    setExpandedId(candidateId)
    if (appMap[candidateId]) return // already loaded
    setAppLoading(candidateId)
    const orgId = DEMO_ORG_ID
    const data: CandidateApplication[] = mockDb.getAllApplications(orgId)
      .filter(a => a.candidate_id === candidateId)
      .map(a => ({
        id:           a.id,
        status:       a.status,
        ai_score:     (a as unknown as { ai_score?: number | null }).ai_score ?? null,
        applied_at:   a.applied_at,
        updated_at:   a.updated_at,
        job:          (a as unknown as { job?: { id: string; title: string; department: string | null } | null }).job ?? null,
        current_stage: a.current_stage ? { name: a.current_stage.name } : null,
      }))
    setAppMap(prev => ({ ...prev, [candidateId]: data }))
    setAppLoading(null)
  }

  const filtered = useMemo(() => {
    if (!search) return candidates
    const q = search.toLowerCase()
    return candidates.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.parsed_data?.skills ?? []).some(s => s.toLowerCase().includes(q))
    )
  }, [candidates, search])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-6 animate-spin text-viridian-600" />
    </div>
  )

  if (!filtered.length) return (
    <EmptyState icon={Users} title="No candidates found" sub="Candidates are people in your talent pool — independent of any specific job." />
  )

  return (
    <>
      <div className="space-y-2">
        {filtered.map(c => {
          const av       = getAvatarColor(c.full_name)
          const grade    = scoreToGrade(c.ai_score)
          const skills   = c.parsed_data?.skills ?? []
          const isOpen   = expandedId === c.id
          const apps     = appMap[c.id] ?? []
          const isLoadingApps = appLoading === c.id

          return (
            <div key={c.id} className="rounded-xl border bg-card overflow-hidden transition-all"
              style={{ borderColor: isOpen ? '#B0D9CF' : undefined }}>

              {/* ── Candidate header row ── */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-viridian-50/30 transition-colors"
                onClick={() => toggleCandidate(c.id)}
              >
                <Avatar className="size-10 shrink-0">
                  <AvatarFallback className={cn('text-sm font-bold', av.bg, av.text)}>
                    {getInitials(c.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground leading-tight">{c.full_name}</p>
                    {c.ai_score != null && grade && (
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', GRADE_CLS[grade])}>
                        <Sparkles className="size-2.5" />{c.ai_score}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3 opacity-50" />{c.email}
                    </span>
                    {c.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="size-3 opacity-50" />{c.phone}
                      </span>
                    )}
                    {c.parsed_data?.experience_years != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="size-3 opacity-50" />{c.parsed_data.experience_years}y exp
                      </span>
                    )}
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {skills.slice(0, 4).map(s => (
                        <span key={s} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{s}</span>
                      ))}
                      {skills.length > 4 && <span className="text-[10px] text-muted-foreground">+{skills.length - 4}</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {c.resume_url && (
                    <a href={c.resume_url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-viridian-300 hover:text-viridian-600 hover:bg-viridian-50 transition-colors">
                      <ExternalLink className="size-3" /> Resume
                    </a>
                  )}
                  {/* Application count pill */}
                  {appMap[c.id] && (
                    <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 border"
                      style={{ background: '#EEF6F3', borderColor: '#B0D9CF', color: '#40826D' }}>
                      {appMap[c.id].length} app{appMap[c.id].length !== 1 ? 's' : ''}
                    </span>
                  )}
                  <div className={cn('flex size-6 items-center justify-center rounded-full transition-all',
                    isOpen ? 'bg-viridian-100' : 'bg-muted'
                  )}>
                    <ChevronDown className={cn('size-3.5 transition-transform text-muted-foreground',
                      isOpen && 'rotate-180 text-viridian-600'
                    )} />
                  </div>
                </div>
              </div>

              {/* ── Application history panel ── */}
              {isOpen && (
                <div className="border-t" style={{ borderColor: '#D6EDE7', background: '#F7FBFA' }}>
                  {isLoadingApps ? (
                    <div className="flex items-center justify-center py-6 gap-2">
                      <Loader2 className="size-4 animate-spin text-viridian-600" />
                      <span className="text-xs text-muted-foreground">Loading applications…</span>
                    </div>
                  ) : apps.length === 0 ? (
                    <div className="flex items-center gap-2 px-6 py-5 text-sm text-muted-foreground">
                      <FileText className="size-4 opacity-50" />
                      No applications on record for this candidate.
                    </div>
                  ) : (
                    <div className="px-5 py-3 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 pl-1">
                        Application History · {apps.length} total
                      </p>
                      {apps.map((app, idx) => {
                        const sCfg  = APP_STATUS[app.status] ?? APP_STATUS.active
                        const grade = scoreToGrade(app.ai_score)
                        const isLatest = idx === 0
                        return (
                          <div
                            key={app.id}
                            className="flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all group/app"
                            style={{
                              background: isLatest ? '#fff' : 'hsl(150,14%,98%)',
                              borderColor: isLatest ? '#B0D9CF' : 'hsl(150,15%,88%)',
                            }}
                            onClick={() => setSelectedAppId(app.id)}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#B0D9CF'; el.style.background = '#EEF6F3' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = isLatest ? '#B0D9CF' : 'hsl(150,15%,88%)'; el.style.background = isLatest ? '#fff' : 'hsl(150,14%,98%)' }}
                          >
                            {/* Role icon */}
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm"
                              style={{ background: isLatest ? '#D6EDE7' : '#EAEFEE' }}>
                              <Briefcase className="size-3.5" style={{ color: isLatest ? '#40826D' : '#9BB5AD' }} />
                            </div>

                            {/* Main info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {app.job?.title ?? '—'}
                                </p>
                                {app.job?.department && (
                                  <span className="text-[11px] text-muted-foreground">{app.job.department}</span>
                                )}
                                {isLatest && (
                                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                                    style={{ background: '#D6EDE7', color: '#2F6F5E' }}>Latest</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <CalendarDays className="size-3 opacity-60" />
                                  {format(new Date(app.applied_at), 'MMM d, yyyy')}
                                </span>
                                {app.current_stage && (
                                  <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 border"
                                    style={{ background: '#EEF6F3', borderColor: '#B0D9CF', color: '#40826D' }}>
                                    {app.current_stage.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right: status + score + arrow */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', sCfg.cls)}>
                                {sCfg.icon}{sCfg.label}
                              </span>
                              {grade && (
                                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', GRADE_CLS[grade])}>
                                  <Sparkles className="size-2.5" />{app.ai_score}%
                                </span>
                              )}
                              <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover/app:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <CandidateDetailPanel
        applicationId={selectedAppId}
        open={!!selectedAppId}
        onClose={() => setSelectedAppId(null)}
      />
    </>
  )
}

// ── Applications Tab ─────────────────────────────────────────

function ApplicationsTab({ search, statusFilter }: { search: string; statusFilter: string }) {
  const [apps, setApps]       = useState<LibApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)

  const doFetch = () => {
    import('@/lib/auth').then(({ loadSession }) => {
      const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
      setLoading(true)
      const rows: LibApplication[] = mockDb.getAllApplications(orgId).map(a => ({
        id:           a.id,
        status:       a.status,
        ai_score:     (a as unknown as { ai_score?: number | null }).ai_score ?? null,
        applied_at:   a.applied_at,
        updated_at:   a.updated_at,
        candidate:    a.candidate ? { id: a.candidate.id, full_name: a.candidate.full_name, email: a.candidate.email } : null,
        job:          (a as unknown as { job?: { id: string; title: string; department: string | null } | null }).job ?? null,
        current_stage: a.current_stage ? { name: a.current_stage.name } : null,
      }))
      setApps(rows)
      setLoading(false)
    })
  }

  useEffect(() => { doFetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps



  const filtered = useMemo(() => {
    return apps.filter(a => {
      const matchesSearch = !search
        || (a.candidate?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
        || (a.candidate?.email ?? '').toLowerCase().includes(search.toLowerCase())
        || (a.job?.title ?? '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || a.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [apps, search, statusFilter])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-6 animate-spin text-viridian-600" />
    </div>
  )

  if (!filtered.length) return (
    <EmptyState icon={LayoutList} title="No applications found" sub="Applications link a candidate to a specific job and track their pipeline stage." />
  )

  return (
    <>
      <div className="space-y-2">
        {filtered.map(app => {
          const candidateName = app.candidate?.full_name ?? 'Unknown'
          const av   = getAvatarColor(candidateName)
          const sCfg = APP_STATUS[app.status] ?? APP_STATUS.active
          return (
            <div
              key={app.id}
              className="group flex items-center gap-4 rounded-xl border bg-card px-5 py-4 hover:border-viridian-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => setSelectedAppId(app.id)}
            >
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className={cn('text-sm font-bold', av.bg, av.text)}>
                  {getInitials(candidateName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground leading-tight">{candidateName}</p>
                  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', sCfg.cls)}>
                    {sCfg.icon}{sCfg.label}
                  </span>
                  {app.current_stage && (
                    <span className="rounded-full bg-viridian-100 border border-viridian-300 px-2 py-0.5 text-[11px] font-semibold text-viridian-600">
                      {app.current_stage.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRight className="size-3 opacity-50" />
                    {app.job?.title ?? '—'}
                    {app.job?.department && <span className="text-muted-foreground/60">· {app.job.department}</span>}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">
                    Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <AiScoreBadge score={app.ai_score} />
                <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          )
        })}
      </div>
      <CandidateDetailPanel
        applicationId={selectedAppId}
        open={!!selectedAppId}
        onClose={() => setSelectedAppId(null)}
      />
    </>
  )
}
// ── Offers Tab ────────────────────────────────────────────────

function OffersTab({ search, statusFilter }: { search: string; statusFilter: string }) {
  const [offers, setOffers]   = useState<LibOffer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('@/lib/auth').then(({ loadSession }) => {
      const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
      setLoading(true)
      setOffers(mockDb.getOffers(orgId) as unknown as LibOffer[])
      setLoading(false)
    })
  }, [])



  const filtered = useMemo(() => {
    return offers.filter(o => {
      const effectiveStatus = o.status === 'pending' && o.expires_at && isPast(new Date(o.expires_at))
        ? 'expired' : o.status
      const matchesSearch = !search
        || o.candidate_name.toLowerCase().includes(search.toLowerCase())
        || o.job_title.toLowerCase().includes(search.toLowerCase())
        || (o.salary ?? '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || effectiveStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [offers, search, statusFilter])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-6 animate-spin text-viridian-600" />
    </div>
  )

  if (!filtered.length) return (
    <EmptyState icon={Send} title="No offers found" sub="Offer letters sent to candidates will appear here." />
  )

  return (
    <div className="space-y-2">
      {filtered.map(offer => {
        const av = getAvatarColor(offer.candidate_name)
        const effectiveStatus = offer.status === 'pending' && offer.expires_at && isPast(new Date(offer.expires_at))
          ? 'expired' : offer.status
        const sCfg = OFFER_STATUS[effectiveStatus] ?? OFFER_STATUS.pending
        const isAccepted = effectiveStatus === 'accepted'
        const isPending  = effectiveStatus === 'pending'

        return (
          <div
            key={offer.id}
            className={cn(
              'group flex items-center gap-4 rounded-xl border bg-card px-5 py-4 transition-all',
              isAccepted && 'border-emerald-200 bg-emerald-50/30',
              isPending  && 'border-amber-200',
            )}
          >
            {/* Avatar */}
            <Avatar className="size-10 shrink-0">
              <AvatarFallback className={cn('text-sm font-bold', av.bg, av.text)}>
                {getInitials(offer.candidate_name)}
              </AvatarFallback>
            </Avatar>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground leading-tight">{offer.candidate_name}</p>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', sCfg.cls)}>
                  {sCfg.icon}{sCfg.label}
                </span>
                {offer.role_type && (
                  <span className="rounded-full bg-muted border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {offer.role_type}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Briefcase className="size-3 opacity-50" />{offer.job_title}
                </span>
                {offer.salary && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="size-3 opacity-50" />{offer.salary}
                  </span>
                )}
                {offer.start_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarCheck className="size-3 opacity-50" />Start {format(new Date(offer.start_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Send className="size-3 opacity-50" />Sent {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                </span>
                {offer.expires_at && (
                  <span className={cn(
                    'flex items-center gap-1 text-[11px]',
                    isPast(new Date(offer.expires_at)) ? 'text-red-500' : 'text-muted-foreground'
                  )}>
                    <Clock className="size-3 opacity-60" />
                    {isPast(new Date(offer.expires_at))
                      ? `Expired ${formatDistanceToNow(new Date(offer.expires_at), { addSuffix: true })}`
                      : `Expires ${formatDistanceToNow(new Date(offer.expires_at), { addSuffix: true })}`}
                  </span>
                )}
                {offer.responded_at && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CalendarDays className="size-3 opacity-60" />
                    Responded {format(new Date(offer.responded_at), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`/offer/${offer.token}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-viridian-300 hover:text-viridian-600 hover:bg-viridian-50 transition-colors"
              >
                <ExternalLink className="size-3" /> View offer
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Library Page ─────────────────────────────────────────

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') ?? 'applications') as Tab

  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  function setTab(t: Tab) {
    setSearch('')
    setStatusFilter('')
    setSearchParams({ tab: t })
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'applications', label: 'Applications', icon: LayoutList, desc: 'Candidate × job matches with pipeline stage' },
    { id: 'candidates',   label: 'Candidates',   icon: Users,      desc: 'All people in your talent pool'             },
    { id: 'offers',       label: 'Offers',        icon: Send,       desc: 'Offer letters sent, pending and accepted'   },
    { id: 'jobs',         label: 'Jobs',          icon: Briefcase,  desc: 'All open, draft and closed roles'           },
  ]

  const APP_STATUS_FILTERS = [
    { value: '', label: 'All statuses' }, { value: 'active', label: 'Active' },
    { value: 'hired', label: 'Hired' }, { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
  ]
  const JOB_STATUS_FILTERS = [
    { value: '', label: 'All statuses' }, { value: 'published', label: 'Active' },
    { value: 'draft', label: 'Draft' }, { value: 'closed', label: 'Closed' },
  ]
  const OFFER_STATUS_FILTERS = [
    { value: '', label: 'All statuses' }, { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' }, { value: 'declined', label: 'Declined' },
    { value: 'expired', label: 'Expired' },
  ]

  const statusOptions =
    tab === 'jobs'   ? JOB_STATUS_FILTERS :
    tab === 'offers' ? OFFER_STATUS_FILTERS :
    APP_STATUS_FILTERS

  const searchPlaceholder =
    tab === 'jobs'       ? 'Search by title, department…' :
    tab === 'candidates' ? 'Search by name, email, skill…' :
    tab === 'offers'     ? 'Search by candidate, role, salary…' :
    'Search by candidate, job…'

  return (
    <AppShell>
      <div className="flex h-full flex-col bg-background">

        {/* Header */}
        <div className="border-b px-8 py-6 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-foreground">Library</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {TABS.find(t => t.id === tab)?.desc ?? 'Browse all records'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                  tab === t.id ? 'text-white' : 'text-muted-foreground hover:text-foreground',
                )}
                style={tab === t.id ? {
                  background: 'linear-gradient(135deg, #40826D, #2F6F5E)',
                  boxShadow: '4px 4px 10px rgba(64,130,109,0.25), -2px -2px 6px rgba(255,255,255,0.5)',
                } : {
                  background: 'hsl(150,14%,91%)',
                  border: '1px solid hsl(150,15%,85%)',
                  boxShadow: '3px 3px 8px rgba(0,0,0,0.05), -2px -2px 6px rgba(255,255,255,0.65)',
                }}
              >
                <t.icon className="size-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters bar */}
        <div className="border-b bg-muted/20 px-8 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-viridian-300 focus:border-viridian-300"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {tab !== 'candidates' && (
              <div className="flex items-center gap-1.5">
                <Filter className="size-3.5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-viridian-300 cursor-pointer"
                >
                  {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}

            {(search || statusFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter('') }}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="size-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {tab === 'jobs'         && <JobsTab         search={search} statusFilter={statusFilter} />}
          {tab === 'candidates'   && <CandidatesTab   search={search} />}
          {tab === 'applications' && <ApplicationsTab search={search} statusFilter={statusFilter} />}
          {tab === 'offers'       && <OffersTab        search={search} statusFilter={statusFilter} />}
        </div>

      </div>
    </AppShell>
  )
}