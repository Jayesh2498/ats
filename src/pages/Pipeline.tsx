/**
 * Kanban Pipeline — Viridian + Claymorphism design
 * Route: /pipeline?job=<id>
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Sparkles, Filter, Share2, MoreHorizontal, X,
  ChevronRight, Loader2, Plus, CheckCircle2,
  Briefcase, Users, Search, Check, Mail,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { cn } from '@/lib/utils'
import { computeAiScore } from '@/lib/aiEngine'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getAvatarColor, getInitials } from '@/types/ats'
import type { Candidate } from '@/types/ats'
import { CandidateDetailPanel } from '@/components/candidate-detail/CandidateDetailPanel'
import SendEmailDialog from '@/components/SendEmailDialog'
import StageMoveModal, { FIXED_STAGES, stageColor } from '@/components/StageMoveModal'
import type { StageName } from '@/components/StageMoveModal'
import { useJobs, useApplications } from '@/hooks/useJobLifecycle'
import { mockDb } from '@/lib/mockDb'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/clipboard'
import type { DbApplication, DbJob } from '@/hooks/useJobLifecycle'

// ── Types ─────────────────────────────────────────────────────

interface PipelineStage {
  id: string
  name: StageName
  order_index: number
  job_id: string
  color: string
}

interface PipelineCard {
  appId:    string
  name:     string
  email:    string
  role:     string
  skills:   string[]
  score:    number
  grade:    'A' | 'B' | 'C' | 'D'
  isTop:    boolean
  stageId:  string
  stageName?: string
  jobTitle: string
  jobId?:   string
  status:   string
}

interface PendingMove {
  appId:         string
  candidateName: string
  fromStageId:   string
  fromStageName: StageName
  toStageId:     string
  toStageName:   StageName
}

// ── Design tokens ──────────────────────────────────────────────

const GRADE_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  A: { border: '#B0D9CF', bg: '#EEF6F3', text: '#245849' },
  B: { border: '#D6EDE7', bg: '#D6EDE7', text: '#2F6F5E' },
  C: { border: '#FDE68A', bg: '#FFFBEB', text: '#92400E' },
  D: { border: '#FECACA', bg: '#FEF2F2', text: '#991B1B' },
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  published: { label: 'Active', bg: '#D6EDE7', text: '#245849' },
  open:      { label: 'Active', bg: '#D6EDE7', text: '#245849' },
  draft:     { label: 'Draft',  bg: '#F3F4F6', text: '#6B7280' },
  closed:    { label: 'Closed', bg: '#FEE2E2', text: '#991B1B' },
}

const CARD_STATUS_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  active:    { label: 'Active',    bg: '#EEF6F3', text: '#245849', border: '#B0D9CF' },
  hired:     { label: 'Hired',     bg: '#D6EDE7', text: '#1B4337', border: '#83C0B3' },
  rejected:  { label: 'Rejected',  bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  withdrawn: { label: 'Withdrawn', bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
}

// ── Helpers ────────────────────────────────────────────────────

function toCandidate(raw: DbApplication['candidate']): Candidate | null {
  if (!raw) return null
  const pd = raw.parsed_data ?? {}
  return {
    id:           raw.id,
    workspace_id: raw.workspace_id,
    full_name:    raw.full_name,
    email:        raw.email,
    phone:        raw.phone,
    resume_url:   raw.resume_url,
    created_at:   raw.created_at,
    updated_at:   raw.updated_at,
    parsed_data: {
      skills:           Array.isArray(pd.skills)               ? (pd.skills as string[]) : [],
      summary:          typeof pd.summary === 'string'          ? pd.summary              : '',
      experience_years: typeof pd.experience_years === 'number' ? pd.experience_years    : null,
      raw_text:         typeof pd.raw_text === 'string'         ? pd.raw_text             : '',
    },
  }
}

function buildCards(applications: DbApplication[], jobTitle: string): PipelineCard[] {
  return applications
    .filter(a => a.candidate)
    .map(app => {
      const candidate = toCandidate(app.candidate)!
      const stageName = (app.current_stage as { name?: string } | undefined)?.name
      const result    = computeAiScore(candidate, jobTitle, stageName)
      return {
        appId:    app.id,
        name:     candidate.full_name,
        email:    candidate.email,
        role:     candidate.parsed_data?.summary?.split('.')[0] ?? candidate.email,
        skills:   candidate.parsed_data?.skills?.slice(0, 2) ?? [],
        score:    result.total,
        grade:    result.grade,
        isTop:    result.total >= 90,
        stageId:  app.current_stage_id ?? '',
        jobTitle,
        status:   app.status ?? 'active',
      }
    })
}

// ── Job Selection Screen ───────────────────────────────────────

function JobSelectionScreen({
  jobs, loading, onConfirm,
}: { jobs: DbJob[]; loading: boolean; onConfirm: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch]     = useState('')

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.department ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col" style={{ background: 'hsl(150,18%,97%)' }}>
      <div className="border-b px-8 py-6 shrink-0" style={{ borderColor: 'hsl(150,15%,87%)' }}>
        <h1 className="text-2xl font-black" style={{ color: '#1F2D2A' }}>Pipeline</h1>
        <p className="text-sm mt-0.5" style={{ color: '#6B7C77' }}>Select one or more jobs to view their candidate pipeline</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: '#6B7C77' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full rounded-[12px] border pl-9 pr-4 py-2.5 text-sm outline-none"
              style={{
                background: 'hsl(150,14%,91%)',
                borderColor: 'hsl(150,15%,87%)',
                boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.06), inset -2px -2px 6px rgba(255,255,255,0.6)',
                color: '#1F2D2A',
              }}
            />
          </div>
          {filtered.length > 0 && (
            <button
              onClick={() =>
                selected.size === filtered.length
                  ? setSelected(new Set())
                  : setSelected(new Set(filtered.map(j => j.id)))
              }
              className="text-sm font-semibold transition-colors whitespace-nowrap"
              style={{ color: '#40826D' }}
            >
              {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-6 animate-spin" style={{ color: '#40826D' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl" style={{ background: 'hsl(150,14%,91%)' }}>
              <Briefcase className="size-6" style={{ color: '#6B7C77' }} />
            </div>
            <p className="font-semibold" style={{ color: '#1F2D2A' }}>No jobs found</p>
            <p className="text-sm" style={{ color: '#6B7C77' }}>
              {jobs.length === 0 ? 'Create a job first to start building your pipeline.' : 'Try a different search term.'}
            </p>
            {jobs.length === 0 && (
              <Link to="/jobs/new" className="mt-1 rounded-[14px] px-5 py-2.5 text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #40826D, #2F6F5E)' }}>
                Create Job
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(job => {
              const isSelected = selected.has(job.id)
              const badge = STATUS_BADGE[job.status] ?? STATUS_BADGE.draft
              return (
                <button
                  key={job.id}
                  onClick={() => toggle(job.id)}
                  className="relative text-left rounded-[18px] p-5 transition-all"
                  style={{
                    border: isSelected ? '1px solid #83C0B3' : '1px solid hsl(150,15%,87%)',
                    background: isSelected ? '#EEF6F3' : 'hsl(152,14%,96%)',
                    boxShadow: isSelected
                      ? '6px 6px 14px rgba(64,130,109,0.15), -4px -4px 10px rgba(255,255,255,0.7)'
                      : '4px 4px 10px rgba(0,0,0,0.05), -3px -3px 8px rgba(255,255,255,0.65)',
                  }}
                >
                  <div className="absolute top-4 right-4 flex size-6 items-center justify-center rounded-full border-2 transition-all"
                    style={{
                      borderColor: isSelected ? '#40826D' : 'hsl(150,15%,85%)',
                      background:  isSelected ? '#40826D' : 'hsl(152,14%,96%)',
                    }}>
                    {isSelected && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl mb-4"
                    style={{ background: isSelected ? '#B0D9CF' : 'hsl(150,14%,89%)' }}>
                    <Briefcase className="size-5" style={{ color: isSelected ? '#245849' : '#6B7C77' }} />
                  </div>
                  <p className="text-base font-bold leading-tight pr-8" style={{ color: '#1F2D2A' }}>{job.title}</p>
                  {job.department && <p className="text-xs mt-0.5" style={{ color: '#6B7C77' }}>{job.department}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: badge.bg, color: badge.text }}>{badge.label}</span>
                    {job.location && <span className="text-[11px]" style={{ color: '#6B7C77' }}>{job.location}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t px-8 py-4 shrink-0 flex items-center justify-between"
        style={{ borderColor: 'hsl(150,15%,87%)', background: 'hsl(150,16%,95%)', opacity: selected.size === 0 ? 0.6 : 1 }}>
        <p className="text-sm" style={{ color: '#6B7C77' }}>
          {selected.size === 0 ? 'No jobs selected' : `${selected.size} job${selected.size > 1 ? 's' : ''} selected`}
        </p>
        <button
          disabled={selected.size === 0}
          onClick={() => onConfirm([...selected])}
          className="flex items-center gap-2 rounded-[14px] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #40826D, #2F6F5E)' }}
        >
          <Users className="size-4" />
          View Pipeline{selected.size > 1 ? 's' : ''}
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

// ── Shared candidate card ──────────────────────────────────────

function CandidateCard({
  card,
  isDragged,
  isLast,
  nextStageName,
  onOpen,
  onEmail,
  onMoveNext,
  showJobLabel = false,
}: {
  card: PipelineCard
  isDragged: boolean
  isLast: boolean
  nextStageName?: string
  onOpen: () => void
  onEmail: () => void
  onMoveNext: () => void
  showJobLabel?: boolean
}) {
  const av = getAvatarColor(card.name)
  const gs = GRADE_STYLES[card.grade]
  const ss = CARD_STATUS_STYLES[card.status] ?? CARD_STATUS_STYLES.active

  return (
    <div
      draggable
      onClick={() => !isDragged && onOpen()}
      className={cn('group cursor-grab active:cursor-grabbing select-none transition-all duration-150', isDragged && 'opacity-40')}
      style={{
        borderRadius: '14px',
        border: card.isTop ? '1px solid #B0D9CF' : '1px solid hsl(150,16%,87%)',
        background: 'hsl(152,14%,96%)',
        padding: '10px 12px',
        boxShadow: isDragged
          ? '12px 12px 24px rgba(0,0,0,0.12), -6px -6px 14px rgba(255,255,255,0.7)'
          : '4px 4px 10px rgba(0,0,0,0.05), -3px -3px 8px rgba(255,255,255,0.65)',
        transform: isDragged ? 'scale(1.02) rotate(1deg)' : '',
      }}
      onMouseEnter={e => {
        if (!isDragged) {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = '8px 8px 16px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.70)'
          el.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '4px 4px 10px rgba(0,0,0,0.05), -3px -3px 8px rgba(255,255,255,0.65)'
        el.style.transform = ''
      }}
    >
      {/* Row 1: avatar + name + status + AI score */}
      <div className="flex items-center gap-2">
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className={cn('text-[10px] font-bold', av.bg, av.text)}>
            {getInitials(card.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-[13px] font-bold leading-tight truncate" style={{ color: '#1F2D2A' }}>{card.name}</p>
            <span className="rounded-full border px-1.5 py-px text-[9px] font-bold shrink-0 leading-tight"
              style={{ background: ss.bg, color: ss.text, borderColor: ss.border }}>
              {ss.label}
            </span>
          </div>
          <p className="text-[11px] truncate leading-tight" style={{ color: '#6B7C77' }}>{card.role}</p>
        </div>
        <span className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold shrink-0"
          style={{ background: gs.bg, color: gs.text, borderColor: gs.border }}>
          <Sparkles className="size-2.5" />
          {card.score}%
        </span>
      </div>

      {/* Row 2: skills + actions */}
      <div className="flex items-center justify-between mt-2 gap-1.5">
        <div className="flex gap-1 flex-wrap min-w-0 items-center">
          {showJobLabel && card.jobTitle && (
            <span className="rounded-md px-1.5 py-px text-[10px] font-semibold leading-tight truncate max-w-[90px]"
              style={{ background: '#D6EDE7', color: '#2F6F5E' }}>
              {card.jobTitle}
            </span>
          )}
          {card.skills.slice(0, showJobLabel ? 1 : 2).map(skill => (
            <span key={skill} className="rounded-md px-1.5 py-px text-[10px] font-semibold leading-tight"
              style={{ background: 'hsl(150,14%,89%)', color: '#6B7C77' }}>
              {skill}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}>
          <button onClick={onEmail} title="Send email"
            className="flex size-5 items-center justify-center rounded transition-all"
            style={{ border: '1px solid hsl(150,15%,85%)', background: 'hsl(150,14%,91%)', color: '#6B7C77' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#D6EDE7'; el.style.color = '#40826D' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'hsl(150,14%,91%)'; el.style.color = '#6B7C77' }}>
            <Mail className="size-3" />
          </button>
          {!isLast && nextStageName && (
            <button onClick={onMoveNext} title={`Move to ${nextStageName}`}
              className="flex size-5 items-center justify-center rounded transition-all"
              style={{ background: '#D6EDE7', border: '1px solid #B0D9CF', color: '#40826D' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#B0D9CF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#D6EDE7' }}>
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Single-job board ───────────────────────────────────────────

function SingleJobBoard({ jobId, jobs, onBack }: { jobId: string; jobs: DbJob[]; onBack: () => void }) {
  const job = jobs.find(j => j.id === jobId)
  const { applications, loading: appsLoading, refetch } = useApplications(jobId)

  const [stages, setStages]               = useState<PipelineStage[]>([])
  const [stagesLoading, setStagesLoading] = useState(true)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [showInsights, setShowInsights]   = useState(true)

  const [filterOpen, setFilterOpen]     = useState(false)
  const [filterSearch, setFilterSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterGrade, setFilterGrade]   = useState('')
  const hasFilter = !!(filterSearch || filterStatus || filterGrade)

  const [pendingMove, setPendingMove]             = useState<PendingMove | null>(null)
  const [draggingAppId, setDraggingAppId]         = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId]     = useState<string | null>(null)
  const [emailTarget, setEmailTarget]             = useState<{ name: string; email: string } | null>(null)
  const filterRef                                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setStagesLoading(true)
    const data = mockDb.getStages(jobId)
    if (data.length > 0) {
      setStages(data.map(s => ({ id: s.id, name: s.name as StageName, order_index: s.order_index, job_id: jobId, color: s.color ?? 'gray' })))
    } else {
      const seed = FIXED_STAGES.map((s, i) => ({ id: `${jobId}-s${i}`, job_id: jobId, name: s.name, order_index: s.order_index, color: 'gray', created_at: new Date().toISOString() }))
      mockDb.upsertStages(jobId, seed)
      setStages(seed.map(s => ({ ...s, name: s.name as StageName })))
    }
    setStagesLoading(false)
  }, [jobId])

  const cards        = useMemo(() => buildCards(applications, job?.title ?? ''), [applications, job])
  const filteredCards = useMemo(() => cards.filter(c => {
    const q = filterSearch.toLowerCase()
    const matchSearch = !filterSearch || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.skills.some(s => s.toLowerCase().includes(q))
    const matchStatus = !filterStatus || c.status === filterStatus
    const matchGrade  = !filterGrade  || c.grade  === filterGrade
    return matchSearch && matchStatus && matchGrade
  }), [cards, filterSearch, filterStatus, filterGrade])

  const stageMap = useMemo(() => {
    const m: Record<string, PipelineCard[]> = {}
    stages.forEach(s => { m[s.id] = [] })
    filteredCards.forEach(c => { if (c.stageId && m[c.stageId]) m[c.stageId].push(c) })
    return m
  }, [stages, filteredCards])

  const loading = appsLoading || stagesLoading

  function initiateMove(appId: string, toStageId: string) {
    const card      = cards.find(c => c.appId === appId)
    const toStage   = stages.find(s => s.id === toStageId)
    const fromStage = stages.find(s => s.id === card?.stageId)
    if (!card || !toStage || !fromStage || card.stageId === toStageId) return
    const fromIdx = stages.findIndex(s => s.id === fromStage.id)
    const toIdx   = stages.findIndex(s => s.id === toStageId)
    if (toIdx !== fromIdx + 1) { toast.error('Candidates must move one stage at a time'); return }
    setPendingMove({ appId, candidateName: card.name, fromStageId: fromStage.id, fromStageName: fromStage.name, toStageId, toStageName: toStage.name })
  }

  async function confirmMove(inputData: Record<string, string>) {
    if (!pendingMove) return
    const { appId, fromStageName, toStageName, toStageId } = pendingMove

    mockDb.updateApplication(appId, { current_stage_id: toStageId })
    mockDb.addActivity({ application_id: appId, type: 'stage_moved', metadata: { from_stage: fromStageName, to_stage: toStageName, input_data: inputData } })

    if (toStageName === 'Interview') {
      const app = applications.find(a => a.id === appId)
      if (app) {
        const dateStr = inputData.interview_date
        const timeStr = inputData.interview_time ?? '10:00'
        const scheduledAt = dateStr
          ? new Date(`${dateStr}T${timeStr.includes(':') ? timeStr : timeStr + ':00'}:00`)
          : new Date(Date.now() + 86400000)
        const ivIso = scheduledAt.toISOString()
        mockDb.addInterview({ application_id: appId, candidate_name: pendingMove.candidateName, job_title: job?.title ?? '', scheduled_at: ivIso, format: 'video', duration_mins: 45 })
        mockDb.addActivity({ application_id: appId, type: 'interview_scheduled', metadata: { scheduled_at: ivIso, format: 'video', duration_mins: 45 } })
      }
    }

    if (toStageName === 'Hired') {
      mockDb.updateApplication(appId, { status: 'hired' })
      const jobData = mockDb.getJobById(jobId)
      if (jobData) {
        const newCount = Math.max(0, (jobData.open_positions ?? 1) - 1)
        mockDb.updateJob(jobId, { open_positions: newCount, ...(newCount === 0 ? { status: 'closed' } : {}) })
        if (newCount === 0) toast.success(`All positions filled — "${job?.title}" is now closed`)
      }
    }

    await refetch()
    setPendingMove(null)
    toast.success(`Moved to ${toStageName}`)
  }

  function onDragStart(e: React.DragEvent, appId: string) {
    setDraggingAppId(appId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('appId', appId)
    setTimeout(() => { (e.currentTarget as HTMLElement).style.opacity = '0.4' }, 0)
  }
  function onDragEnd(e: React.DragEvent) { (e.currentTarget as HTMLElement).style.opacity = '1'; setDraggingAppId(null); setDragOverStageId(null) }
  function onColumnDragOver(e: React.DragEvent, stageId: string) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStageId(stageId) }
  function onColumnDragLeave() { setDragOverStageId(null) }
  function onColumnDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault()
    const appId = e.dataTransfer.getData('appId') || draggingAppId
    setDragOverStageId(null)
    setDraggingAppId(null)
    if (appId) initiateMove(appId, stageId)
  }

  // Top 5 candidates sorted by AI score
  const topMatches = useMemo(
    () => [...filteredCards].sort((a, b) => b.score - a.score).slice(0, 5),
    [filteredCards]
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Sub-header */}
      <div className="px-8 py-5 shrink-0" style={{ background: 'hsl(150,18%,97%)', borderBottom: '1px solid hsl(150,15%,87%)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: '#6B7C77' }}>
              <button onClick={onBack} className="hover:underline transition-colors" style={{ color: '#6B7C77' }}>Pipeline</button>
              <ChevronRight className="size-3" />
              <span className="font-medium" style={{ color: '#1F2D2A' }}>{job?.title ?? 'Loading...'}</span>
            </div>
            {/* ── Title = job name ── */}
            <h1 className="text-2xl font-black" style={{ color: '#1F2D2A' }}>{job?.title ?? 'Loading...'}</h1>
            <div className="flex items-center gap-1.5 text-sm mt-1" style={{ color: '#6B7C77' }}>
              <div className="size-2 rounded-full" style={{ background: job?.status === 'published' || job?.status === 'open' ? '#40826D' : '#9CA3AF' }} />
              {job?.status === 'published' || job?.status === 'open' ? 'Active' : 'Draft'} · {applications.length} Candidate{applications.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-2 rounded-[14px] border px-4 py-2 text-sm font-semibold transition-all"
              style={filterOpen || hasFilter ? {
                borderColor: '#83C0B3', background: '#EEF6F3', color: '#245849',
                boxShadow: '4px 4px 10px rgba(64,130,109,0.12), -3px -3px 8px rgba(255,255,255,0.6)',
              } : {
                borderColor: 'hsl(150,15%,87%)', background: 'hsl(152,14%,96%)', color: '#6B7C77',
                boxShadow: '4px 4px 8px rgba(0,0,0,0.05), -3px -3px 6px rgba(255,255,255,0.6)',
              }}
            >
              <Filter className="size-3.5" />
              Filter
              {hasFilter && (
                <span className="flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white leading-none"
                  style={{ background: '#40826D' }}>
                  {[filterSearch, filterStatus, filterGrade].filter(Boolean).length}
                </span>
              )}
            </button>

            {job?.public_slug && (
              <button
                onClick={() => { copyToClipboard(`${window.location.origin}/apply/${job.public_slug}`); toast.success('Application link copied!') }}
                className="flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #40826D, #2F6F5E)' }}
              >
                <Share2 className="size-3.5" /> Share
              </button>
            )}
          </div>
        </div>

        {filterOpen && (
          <div ref={filterRef} className="flex items-center gap-2.5 mt-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none" style={{ color: '#6B7C77' }} />
              <input
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                placeholder="Search candidates…"
                className="h-8 w-48 rounded-[10px] border pl-8 pr-3 text-sm outline-none"
                style={{
                  background: 'hsl(150,14%,91%)', borderColor: 'hsl(150,15%,87%)',
                  boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.06), inset -2px -2px 5px rgba(255,255,255,0.6)',
                  color: '#1F2D2A',
                }}
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="h-8 rounded-[10px] border px-2.5 text-sm outline-none cursor-pointer"
              style={{ background: 'hsl(150,14%,91%)', borderColor: 'hsl(150,15%,87%)', color: '#1F2D2A' }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
              className="h-8 rounded-[10px] border px-2.5 text-sm outline-none cursor-pointer"
              style={{ background: 'hsl(150,14%,91%)', borderColor: 'hsl(150,15%,87%)', color: '#1F2D2A' }}>
              <option value="">All AI grades</option>
              <option value="A">Grade A (85%+)</option>
              <option value="B">Grade B (70%+)</option>
              <option value="C">Grade C (50%+)</option>
              <option value="D">Grade D (&lt;50%)</option>
            </select>
            {hasFilter && (
              <>
                <button onClick={() => { setFilterSearch(''); setFilterStatus(''); setFilterGrade('') }}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-muted"
                  style={{ color: '#6B7C77' }}>
                  <X className="size-3.5" /> Clear
                </button>
                <span className="text-xs" style={{ color: '#6B7C77' }}>{filteredCards.length} of {cards.length} shown</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Top Matches bar — above the kanban ── */}
      {!loading && showInsights && topMatches.length > 0 && (
        <div className="shrink-0 px-6 pt-4 pb-2" style={{ background: 'hsl(150,18%,97%)', borderBottom: '1px solid hsl(150,15%,87%)' }}>
          <div className="flex items-center gap-3">
            {/* Label */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex size-7 items-center justify-center rounded-lg" style={{ background: '#D6EDE7', color: '#40826D' }}>
                <Sparkles className="size-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold leading-none" style={{ color: '#1F2D2A' }}>Top Matches</p>
                <p className="text-[10px] leading-none mt-0.5" style={{ color: '#6B7C77' }}>By AI score</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px shrink-0" style={{ background: 'hsl(150,15%,87%)' }} />

            {/* Candidate pills */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto min-w-0">
              {topMatches.map((c, i) => (
                <button
                  key={c.appId}
                  onClick={() => setSelectedAppId(c.appId)}
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 shrink-0 transition-all"
                  style={{
                    background: 'hsl(152,14%,96%)',
                    border: '1px solid hsl(150,16%,87%)',
                    boxShadow: '3px 3px 8px rgba(0,0,0,0.05),-2px -2px 6px rgba(255,255,255,0.65)',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#B0D9CF'; el.style.background = '#EEF6F3' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'hsl(150,16%,87%)'; el.style.background = 'hsl(152,14%,96%)' }}
                >
                  <span className="text-[10px] font-black w-4 shrink-0" style={{ color: '#6B7C77' }}>#{i + 1}</span>
                  <Avatar className="size-5 shrink-0">
                    <AvatarFallback className={cn('text-[8px] font-bold', getAvatarColor(c.name).bg, getAvatarColor(c.name).text)}>
                      {getInitials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold leading-none truncate max-w-[80px]" style={{ color: '#1F2D2A' }}>{c.name}</p>
                    <p className="text-[10px] leading-none mt-0.5" style={{ color: '#40826D' }}>{c.score}% match</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setShowInsights(false)}
              className="shrink-0 flex size-6 items-center justify-center rounded-lg transition-colors hover:bg-muted"
              style={{ color: '#6B7C77' }}
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin" style={{ color: '#40826D' }} />
        </div>
      )}

      {!loading && stages.length > 0 && (
        <div className="flex flex-1 overflow-x-auto overflow-y-hidden gap-4 px-6 py-5">
          {stages.map((stage, stageIdx) => {
            const stageCards   = stageMap[stage.id] ?? []
            const isDropTarget = dragOverStageId === stage.id
            const col          = stageColor(stage.name)
            const isLast       = stageIdx === stages.length - 1
            const nextStage    = stages[stageIdx + 1]

            return (
              <div
                key={stage.id}
                className="flex w-[17rem] shrink-0 flex-col"
                onDragOver={e => onColumnDragOver(e, stage.id)}
                onDragLeave={onColumnDragLeave}
                onDrop={e => onColumnDrop(e, stage.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex size-2.5 rounded-full shrink-0', col.dot)} />
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#1F2D2A' }}>{stage.name}</span>
                    <span className={cn('flex size-5 items-center justify-center rounded-full text-[10px] font-bold', col.badge, col.badgeText)}>
                      {stageCards.length}
                    </span>
                  </div>
                  <button className="transition-colors" style={{ color: '#6B7C77' }}>
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>

                <div
                  className="flex-1 space-y-2 overflow-y-auto pr-0.5 rounded-[14px] transition-all min-h-[80px] pb-1"
                  style={isDropTarget && draggingAppId ? { background: '#EEF6F3', outline: '2px solid #83C0B3', outlineOffset: '2px' } : {}}
                  onDragStart={() => { /* handled on card */ }}
                >
                  {stageCards.map(card => (
                    <div key={card.appId}
                      draggable
                      onDragStart={e => onDragStart(e, card.appId)}
                      onDragEnd={onDragEnd}
                    >
                      <CandidateCard
                        card={card}
                        isDragged={draggingAppId === card.appId}
                        isLast={isLast}
                        nextStageName={nextStage?.name}
                        onOpen={() => setSelectedAppId(card.appId)}
                        onEmail={() => setEmailTarget({ name: card.name, email: card.email })}
                        onMoveNext={() => nextStage && initiateMove(card.appId, nextStage.id)}
                      />
                    </div>
                  ))}

                  {stageCards.length === 0 && (
                    <div className="rounded-[14px] border-2 border-dashed p-4 text-center transition-colors"
                      style={isDropTarget && draggingAppId
                        ? { borderColor: '#40826D', background: '#EEF6F3' }
                        : { borderColor: 'hsl(150,15%,87%)' }}>
                      {stage.order_index === 0 && !hasFilter ? (
                        <div className="py-2">
                          <CheckCircle2 className="size-5 mx-auto mb-1.5" style={{ color: 'hsl(150,10%,75%)' }} />
                          <p className="text-[11px]" style={{ color: 'hsl(150,10%,65%)' }}>Share the link to receive applicants</p>
                        </div>
                      ) : (
                        <p className="text-xs py-1" style={{ color: 'hsl(150,10%,65%)' }}>
                          {isDropTarget && draggingAppId ? 'Drop here' : hasFilter ? 'No matches' : 'No candidates'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && stages.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-8">
          <div className="flex size-14 items-center justify-center rounded-2xl" style={{ background: 'hsl(150,14%,91%)' }}>
            <Plus className="size-6" style={{ color: '#6B7C77' }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: '#1F2D2A' }}>No pipeline stages</h2>
          <p className="text-sm max-w-xs" style={{ color: '#6B7C77' }}>Pipeline stages are seeded automatically when a job is created.</p>
        </div>
      )}

      <CandidateDetailPanel applicationId={selectedAppId} open={!!selectedAppId} onClose={() => setSelectedAppId(null)} defaultTab="overview" />
      <SendEmailDialog open={!!emailTarget} onClose={() => setEmailTarget(null)} candidate={emailTarget ?? undefined} job={{ title: job?.title }} />
      {pendingMove && (
        <StageMoveModal
          open={true}
          candidateName={pendingMove.candidateName}
          fromStage={pendingMove.fromStageName}
          toStage={pendingMove.toStageName}
          onConfirm={confirmMove}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </div>
  )
}

// ── All-jobs board (merged view) ───────────────────────────────

function AllJobsBoard({ jobIds, jobs }: { jobIds: string[]; jobs: DbJob[]; onBack: () => void }) {
  const [allApplications, setAllApplications] = useState<DbApplication[]>([])
  const [allStages, setAllStages]             = useState<PipelineStage[]>([])
  const [loading, setLoading]                 = useState(true)
  const [selectedAppId, setSelectedAppId]     = useState<string | null>(null)
  const [filterSearch, setFilterSearch]       = useState('')
  const [filterJob, setFilterJob]             = useState('')
  const [filterGrade, setFilterGrade]         = useState('')
  const [filterStatus, setFilterStatus]       = useState('')
  const [filterOpen, setFilterOpen]           = useState(false)
  const [emailTarget, setEmailTarget]         = useState<{ name: string; email: string } | null>(null)
  const [pendingMove, setPendingMove]         = useState<PendingMove | null>(null)
  const [draggingAppId, setDraggingAppId]     = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

  const hasFilter = !!(filterSearch || filterJob || filterGrade || filterStatus)

  useEffect(() => {
    setLoading(true)
    const apps: DbApplication[] = jobIds.flatMap(id => mockDb.getApplications(id) as DbApplication[])
    setAllApplications(apps)
    const seen = new Set<string>()
    const deduped: PipelineStage[] = []
    jobIds.flatMap(id => mockDb.getStages(id)).forEach(s => {
      if (!seen.has(s.name)) { seen.add(s.name); deduped.push({ ...s, name: s.name as StageName }) }
    })
    setAllStages(deduped)
    setLoading(false)
  }, [jobIds.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const stageNameToIds = useMemo(() => {
    const m: Record<string, string[]> = {}
    allApplications.forEach(app => {
      const stageName = (app.current_stage as { name?: string } | undefined)?.name
      const stageId   = app.current_stage_id
      if (stageName && stageId) {
        if (!m[stageName]) m[stageName] = []
        if (!m[stageName].includes(stageId)) m[stageName].push(stageId)
      }
    })
    return m
  }, [allApplications])

  const cards = useMemo(() => allApplications
    .filter(a => a.candidate)
    .map(app => {
      const jobTitle  = jobs.find(j => j.id === app.job_id)?.title ?? ''
      const candidate = toCandidate(app.candidate)!
      const stageName = (app.current_stage as { name?: string } | undefined)?.name
      const result    = computeAiScore(candidate, jobTitle, stageName)
      return {
        appId:     app.id,
        name:      candidate.full_name,
        email:     candidate.email,
        role:      candidate.parsed_data?.summary?.split('.')[0] ?? candidate.email,
        skills:    candidate.parsed_data?.skills?.slice(0, 2) ?? [],
        score:     result.total,
        grade:     result.grade,
        isTop:     result.total >= 90,
        stageId:   app.current_stage_id ?? '',
        stageName: stageName ?? '',
        jobTitle,
        jobId:     app.job_id,
        status:    app.status ?? 'active',
      }
    }), [allApplications, jobs])

  const filteredCards = useMemo(() => cards.filter(c => {
    const q = filterSearch.toLowerCase()
    const matchSearch = !filterSearch || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.skills.some(s => s.toLowerCase().includes(q))
    const matchJob    = !filterJob    || c.jobId === filterJob
    const matchGrade  = !filterGrade  || c.grade === filterGrade
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchJob && matchGrade && matchStatus
  }), [cards, filterSearch, filterJob, filterGrade, filterStatus])

  const stageMap = useMemo(() => {
    const m: Record<string, typeof filteredCards> = {}
    allStages.forEach(s => { m[s.name] = [] })
    filteredCards.forEach(c => { if (c.stageName && m[c.stageName]) m[c.stageName].push(c) })
    return m
  }, [allStages, filteredCards])

  function initiateMove(appId: string, toStageName: string) {
    const app  = allApplications.find(a => a.id === appId)
    const card = cards.find(c => c.appId === appId)
    if (!app || !card) return
    const fromStageName = card.stageName as StageName
    const toStageIds    = stageNameToIds[toStageName] ?? []
    const toStageId     = toStageIds.find(id =>
      allApplications.some(a => a.current_stage_id === id && a.job_id === app.job_id)
      || allStages.find(s => s.id === id)
    ) ?? toStageIds[0]
    if (!toStageId || fromStageName === toStageName) return
    const fromIdx = allStages.findIndex(s => s.name === fromStageName)
    const toIdx   = allStages.findIndex(s => s.name === toStageName)
    if (toIdx !== fromIdx + 1) { toast.error('Candidates must move one stage at a time'); return }
    const stagesForJob = allApplications.filter(a => a.job_id === app.job_id).map(a => a.current_stage as { id?: string; name?: string } | undefined)
    const targetStage  = stagesForJob.find(s => s?.name === toStageName)
    const resolvedId   = (targetStage as { id?: string } | undefined)?.id ?? toStageId
    setPendingMove({ appId, candidateName: card.name, fromStageId: app.current_stage_id ?? '', fromStageName, toStageId: resolvedId, toStageName: toStageName as StageName })
  }

  async function confirmMove(inputData: Record<string, string>) {
    if (!pendingMove) return
    const { appId, fromStageName, toStageName, toStageId } = pendingMove

    mockDb.updateApplication(appId, { current_stage_id: toStageId })
    mockDb.addActivity({ application_id: appId, type: 'stage_moved', metadata: { from_stage: fromStageName, to_stage: toStageName, input_data: inputData } })

    if (toStageName === 'Hired') {
      mockDb.updateApplication(appId, { status: 'hired' })
      const app = allApplications.find(a => a.id === appId)
      if (app) {
        const jobData = mockDb.getJobById(app.job_id)
        if (jobData) {
          const newCount = Math.max(0, (jobData.open_positions ?? 1) - 1)
          mockDb.updateJob(jobData.id, { open_positions: newCount, ...(newCount === 0 ? { status: 'closed' } : {}) })
          if (newCount === 0) toast.success(`All positions filled — "${jobData.title}" is now closed`)
        }
      }
    }

    const updated: DbApplication[] = jobIds.flatMap(id => mockDb.getApplications(id) as DbApplication[])
    setAllApplications(updated)
    setPendingMove(null)
    toast.success(`Moved to ${toStageName}`)
  }

  function onDragStart(e: React.DragEvent, appId: string) {
    setDraggingAppId(appId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('appId', appId)
    setTimeout(() => { (e.currentTarget as HTMLElement).style.opacity = '0.4' }, 0)
  }
  function onDragEnd(e: React.DragEvent) { (e.currentTarget as HTMLElement).style.opacity = '1'; setDraggingAppId(null); setDragOverStageId(null) }
  function onColDragOver(e: React.DragEvent, stageName: string) { e.preventDefault(); setDragOverStageId(stageName) }
  function onColDrop(e: React.DragEvent, stageName: string) {
    e.preventDefault()
    const appId = e.dataTransfer.getData('appId') || draggingAppId
    setDragOverStageId(null)
    setDraggingAppId(null)
    if (appId) initiateMove(appId, stageName)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-5 shrink-0" style={{ background: 'hsl(150,18%,97%)', borderBottom: '1px solid hsl(150,15%,87%)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#1F2D2A' }}>All Pipelines</h1>
            <div className="flex items-center gap-1.5 text-sm mt-1" style={{ color: '#6B7C77' }}>
              <div className="size-2 rounded-full" style={{ background: '#40826D' }} />
              {jobIds.length} jobs · {allApplications.length} Candidate{allApplications.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-2 rounded-[14px] border px-4 py-2 text-sm font-semibold transition-all"
            style={filterOpen || hasFilter ? {
              borderColor: '#83C0B3', background: '#EEF6F3', color: '#245849',
              boxShadow: '4px 4px 10px rgba(64,130,109,0.12), -3px -3px 8px rgba(255,255,255,0.6)',
            } : {
              borderColor: 'hsl(150,15%,87%)', background: 'hsl(152,14%,96%)', color: '#6B7C77',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.05), -3px -3px 6px rgba(255,255,255,0.6)',
            }}
          >
            <Filter className="size-3.5" />
            Filter
            {hasFilter && (
              <span className="flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: '#40826D' }}>
                {[filterSearch, filterJob, filterGrade, filterStatus].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {filterOpen && (
          <div className="flex items-center gap-2.5 mt-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none" style={{ color: '#6B7C77' }} />
              <input value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Search candidates…"
                className="h-8 w-48 rounded-[10px] border pl-8 pr-3 text-sm outline-none"
                style={{ background: 'hsl(150,14%,91%)', borderColor: 'hsl(150,15%,87%)', color: '#1F2D2A', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.06), inset -2px -2px 5px rgba(255,255,255,0.6)' }} />
            </div>
            <select value={filterJob} onChange={e => setFilterJob(e.target.value)}
              className="h-8 rounded-[10px] border px-2.5 text-sm outline-none cursor-pointer"
              style={{ background: 'hsl(150,14%,91%)', borderColor: 'hsl(150,15%,87%)', color: '#1F2D2A' }}>
              <option value="">All jobs</option>
              {jobIds.map(id => <option key={id} value={id}>{jobs.find(j => j.id === id)?.title ?? id}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="h-8 rounded-[10px] border px-2.5 text-sm outline-none cursor-pointer"
              style={{ background: 'hsl(150,14%,91%)', borderColor: 'hsl(150,15%,87%)', color: '#1F2D2A' }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
              className="h-8 rounded-[10px] border px-2.5 text-sm outline-none cursor-pointer"
              style={{ background: 'hsl(150,14%,91%)', borderColor: 'hsl(150,15%,87%)', color: '#1F2D2A' }}>
              <option value="">All AI grades</option>
              <option value="A">Grade A (85%+)</option>
              <option value="B">Grade B (70%+)</option>
              <option value="C">Grade C (50%+)</option>
              <option value="D">Grade D (&lt;50%)</option>
            </select>
            {hasFilter && (
              <>
                <button onClick={() => { setFilterSearch(''); setFilterJob(''); setFilterGrade(''); setFilterStatus('') }}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold hover:bg-muted transition-colors"
                  style={{ color: '#6B7C77' }}>
                  <X className="size-3.5" /> Clear
                </button>
                <span className="text-xs" style={{ color: '#6B7C77' }}>{filteredCards.length} of {cards.length} shown</span>
              </>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin" style={{ color: '#40826D' }} />
        </div>
      )}

      {!loading && (
        <div className="flex flex-1 overflow-x-auto overflow-y-hidden gap-4 px-6 py-5">
          {allStages.map((stage, stageIdx) => {
            const stageCards   = stageMap[stage.name] ?? []
            const isDropTarget = dragOverStageId === stage.name
            const col          = stageColor(stage.name)
            const isLast       = stageIdx === allStages.length - 1
            const nextStage    = allStages[stageIdx + 1]

            return (
              <div
                key={stage.id}
                className="flex w-[17rem] shrink-0 flex-col"
                onDragOver={e => onColDragOver(e, stage.name)}
                onDragLeave={() => setDragOverStageId(null)}
                onDrop={e => onColDrop(e, stage.name)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex size-2.5 rounded-full shrink-0', col.dot)} />
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#1F2D2A' }}>{stage.name}</span>
                    <span className={cn('flex size-5 items-center justify-center rounded-full text-[10px] font-bold', col.badge, col.badgeText)}>
                      {stageCards.length}
                    </span>
                  </div>
                </div>

                <div
                  className="flex-1 space-y-2 overflow-y-auto pr-0.5 rounded-[14px] transition-all min-h-[80px] pb-1"
                  style={isDropTarget && draggingAppId ? { background: '#EEF6F3', outline: '2px solid #83C0B3', outlineOffset: '2px' } : {}}
                >
                  {stageCards.map(card => (
                    <div key={card.appId} draggable onDragStart={e => onDragStart(e, card.appId)} onDragEnd={onDragEnd}>
                      <CandidateCard
                        card={card}
                        isDragged={draggingAppId === card.appId}
                        isLast={isLast}
                        nextStageName={nextStage?.name}
                        onOpen={() => setSelectedAppId(card.appId)}
                        onEmail={() => setEmailTarget({ name: card.name, email: card.email })}
                        onMoveNext={() => nextStage && initiateMove(card.appId, nextStage.name)}
                        showJobLabel
                      />
                    </div>
                  ))}

                  {stageCards.length === 0 && (
                    <div className="rounded-[14px] border-2 border-dashed p-4 text-center"
                      style={isDropTarget && draggingAppId ? { borderColor: '#40826D', background: '#EEF6F3' } : { borderColor: 'hsl(150,15%,87%)' }}>
                      <p className="text-xs py-1" style={{ color: 'hsl(150,10%,65%)' }}>
                        {isDropTarget && draggingAppId ? 'Drop here' : hasFilter ? 'No matches' : 'No candidates'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CandidateDetailPanel applicationId={selectedAppId} open={!!selectedAppId} onClose={() => setSelectedAppId(null)} defaultTab="overview" />
      <SendEmailDialog open={!!emailTarget} onClose={() => setEmailTarget(null)} candidate={emailTarget ?? undefined} />
      {pendingMove && (
        <StageMoveModal
          open={true}
          candidateName={pendingMove.candidateName}
          fromStage={pendingMove.fromStageName}
          toStage={pendingMove.toStageName}
          onConfirm={confirmMove}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </div>
  )
}

// ── Multi-job tab view ─────────────────────────────────────────

function MultiJobView({ jobIds, jobs, onBack }: { jobIds: string[]; jobs: DbJob[]; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<string>('__all__')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0" style={{ background: 'hsl(150,18%,95%)', borderBottom: '1px solid hsl(150,15%,87%)' }}>
        <div className="flex items-center px-6 pt-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs mr-4 mb-3 transition-colors"
            style={{ color: '#6B7C77' }}>
            ← Back to selection
          </button>
          <div className="flex items-center gap-1 overflow-x-auto flex-1">
            <button
              onClick={() => setActiveTab('__all__')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 whitespace-nowrap transition-all"
              style={activeTab === '__all__' ? {
                borderColor: '#40826D', color: '#2F6F5E', background: 'hsl(162,34%,95%)',
              } : { borderColor: 'transparent', color: '#6B7C77' }}
            >
              <Users className="size-3.5" />
              All
              <span className="text-[10px] font-bold px-1.5 py-px rounded-full"
                style={{ background: activeTab === '__all__' ? '#D6EDE7' : 'hsl(150,14%,89%)', color: activeTab === '__all__' ? '#2F6F5E' : '#6B7C77' }}>
                {jobIds.length}
              </span>
            </button>
            {jobIds.map(id => {
              const job = jobs.find(j => j.id === id)
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 whitespace-nowrap transition-all"
                  style={activeTab === id ? {
                    borderColor: '#40826D', color: '#2F6F5E', background: 'hsl(162,34%,95%)',
                  } : { borderColor: 'transparent', color: '#6B7C77' }}
                >
                  <Briefcase className="size-3.5" />
                  {job?.title ?? id}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === '__all__'
          ? <AllJobsBoard key="all" jobIds={jobIds} jobs={jobs} onBack={onBack} />
          : <SingleJobBoard key={activeTab} jobId={activeTab} jobs={jobs} onBack={onBack} />
        }
      </div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────

export default function Pipeline() {
  const [searchParams, setSearchParams] = useSearchParams()
  const jobId = searchParams.get('job') ?? undefined
  const { jobs, loading: jobsLoading } = useJobs()
  const [activeJobIds, setActiveJobIds] = useState<string[]>(jobId ? [jobId] : [])

  function handleConfirm(ids: string[]) {
    setActiveJobIds(ids)
    if (ids.length === 1) setSearchParams({ job: ids[0] })
    else setSearchParams({})
  }
  function handleBack() { setActiveJobIds([]); setSearchParams({}) }

  if (activeJobIds.length === 0) return <AppShell><JobSelectionScreen jobs={jobs} loading={jobsLoading} onConfirm={handleConfirm} /></AppShell>
  if (activeJobIds.length === 1) return <AppShell><SingleJobBoard jobId={activeJobIds[0]} jobs={jobs} onBack={handleBack} /></AppShell>
  return <AppShell><MultiJobView jobIds={activeJobIds} jobs={jobs} onBack={handleBack} /></AppShell>
}
