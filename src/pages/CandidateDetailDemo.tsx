/**
 * Pipeline demo — AI-scored candidate list with detail panel.
 * Route: /app
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Users, Briefcase, Sparkles, ChevronRight, Zap, ArrowUpDown, Mail, ArrowLeft } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getAvatarColor, getInitials, STATUS_COLORS } from '@/types/ats'
import { MOCK_APPLICATIONS, MOCK_JOB, MOCK_STAGES } from '@/lib/mock-data'
import { CandidateDetailPanel } from '@/components/candidate-detail/CandidateDetailPanel'
import { AiScoreRing } from '@/components/candidate-detail/AiScoreRing'
import { SkillPills } from '@/components/candidate-detail/SkillPills'
import { AiScoreBadge } from '@/components/ai/AiScoreBadge'
import { TopCandidateBadge } from '@/components/ai/TopCandidateBadge'
import { computeAiScore } from '@/lib/aiEngine'

type DefaultTab = 'overview' | 'activity' | 'notes' | 'email' | 'offer'
type SortKey = 'score' | 'name' | 'applied'

// Pre-compute AI scores for all mock applications
const SCORED_APPS = MOCK_APPLICATIONS.map(app => ({
  app,
  result: computeAiScore(
    app.candidate!,
    app.job?.title ?? '',
    app.current_stage?.name,
  ),
}))

const TOP_SCORE = Math.max(...SCORED_APPS.map(a => a.result.total))

export default function CandidateDetailDemo() {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [defaultTab, setDefaultTab] = useState<DefaultTab>('overview')
  const [sortKey, setSortKey] = useState<SortKey>('score')

  function openPanel(appId: string, tab: DefaultTab = 'overview') {
    setSelectedAppId(appId)
    setDefaultTab(tab)
  }

  const sorted = useMemo(() => {
    return [...SCORED_APPS].sort((a, b) => {
      if (sortKey === 'score') return b.result.total - a.result.total
      if (sortKey === 'name') return a.app.candidate!.full_name.localeCompare(b.app.candidate!.full_name)
      return new Date(b.app.applied_at).getTime() - new Date(a.app.applied_at).getTime()
    })
  }, [sortKey])

  return (
    <div className="min-h-screen bg-background">

      {/* ── Page Header ── */}
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-600">
              <Briefcase className="size-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">SuperHire ATS</h1>
              <p className="text-xs text-muted-foreground">Candidate Pipeline</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              <ArrowLeft className="size-3.5" />
              Home
            </Link>
            <Link
              to="/email-templates"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              <Mail className="size-3.5" />
              Templates
            </Link>
            <Link
              to="/workflows"
              className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100"
            >
              <Zap className="size-3.5" />
              Workflows
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">

        {/* Job context card */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{MOCK_JOB.title}</h2>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Open
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{MOCK_JOB.department}</span>
                <span>·</span>
                <span>{MOCK_JOB.location}</span>
                <span>·</span>
                <span>{MOCK_JOB.candidate_count} candidates</span>
              </div>
            </div>

            {/* Pipeline stages */}
            <div className="hidden sm:flex items-center gap-1">
              {MOCK_STAGES.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-1">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {stage.name}
                  </span>
                  {i < MOCK_STAGES.length - 1 && (
                    <ChevronRight className="size-3 text-muted-foreground/40" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section heading + sort bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Applications
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {MOCK_APPLICATIONS.length}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground mr-1">Sort:</span>
            {(['score', 'name', 'applied'] as SortKey[]).map(key => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  sortKey === key
                    ? 'bg-violet-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-violet-50 hover:text-violet-700',
                )}
              >
                {key === 'score' ? 'AI Score' : key === 'name' ? 'Name' : 'Applied'}
              </button>
            ))}
          </div>
        </div>

        {/* Application cards */}
        <div className="space-y-3">
          {sorted.map(({ app, result }, listIndex) => {
            const candidate = app.candidate!
            const avatarColor = getAvatarColor(candidate.full_name)
            const initials = getInitials(candidate.full_name)
            const skills = candidate.parsed_data?.skills ?? []
            const stage = MOCK_STAGES.find(s => s.id === app.current_stage_id)
            const isSelected = selectedAppId === app.id
            const isTopCandidate = result.total === TOP_SCORE && result.total >= 75

            return (
              <div
                key={app.id}
                onClick={() => openPanel(app.id, 'overview')}
                className={cn(
                  'group cursor-pointer rounded-xl border bg-card p-4 transition-all duration-150',
                  'hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50',
                  isSelected && 'border-violet-300 bg-violet-50/30 shadow-md shadow-violet-100/50',
                  isTopCandidate && !isSelected && 'border-violet-200/80 bg-violet-50/20',
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <div className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-2',
                    listIndex === 0 && sortKey === 'score'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {listIndex + 1}
                  </div>

                  {/* Avatar */}
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className={cn('text-sm font-semibold', avatarColor.bg, avatarColor.text)}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {candidate.full_name}
                        </span>
                        {isTopCandidate && <TopCandidateBadge />}
                        {stage && (
                          <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            {stage.name}
                          </span>
                        )}
                        <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold', STATUS_COLORS[app.status])}>
                          {app.status}
                        </span>
                      </div>

                      {isTopCandidate && sortKey === 'score' ? (
                        <AiScoreRing score={result.total} size="sm" className="shrink-0" />
                      ) : (
                        <AiScoreBadge score={result.total} grade={result.grade} size="sm" className="shrink-0" />
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground">{candidate.email}</p>

                    {skills.length > 0 && (
                      <SkillPills skills={skills} limit={4} className="mt-2" />
                    )}

                    {/* Quick actions */}
                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionChip icon={<Sparkles className="size-3" />} label="Overview" onClick={e => { e.stopPropagation(); openPanel(app.id, 'overview') }} />
                      <ActionChip icon={<span className="text-[10px]">📋</span>} label="Activity" onClick={e => { e.stopPropagation(); openPanel(app.id, 'activity') }} />
                      <ActionChip icon={<span className="text-[10px]">📝</span>} label="Note" onClick={e => { e.stopPropagation(); openPanel(app.id, 'notes') }} />
                      <ActionChip icon={<span className="text-[10px]">✉️</span>} label="Email" onClick={e => { e.stopPropagation(); openPanel(app.id, 'email') }} />
                      <ActionChip icon={<span className="text-[10px]">🎁</span>} label="Offer" onClick={e => { e.stopPropagation(); openPanel(app.id, 'offer') }} />
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* AI callout */}
        <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="size-4 text-violet-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-violet-700">AI Scoring Active</p>
              <p className="mt-0.5 text-xs text-violet-500">
                Scores are computed from skills match, experience, summary quality, and pipeline stage.
                Click any candidate → Overview tab to see the full breakdown and re-score.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Detail panel */}
      <CandidateDetailPanel
        applicationId={selectedAppId}
        open={!!selectedAppId}
        onClose={() => setSelectedAppId(null)}
        defaultTab={defaultTab}
      />
    </div>
  )
}

function ActionChip({
  icon, label, onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
    >
      {icon}
      {label}
    </button>
  )
}
