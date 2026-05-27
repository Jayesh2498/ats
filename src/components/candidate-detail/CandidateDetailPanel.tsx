// ============================================================
// CandidateDetailPanel — slide-over panel with 5 tabs
// Viridian claymorphism style
// ============================================================

import { useEffect, useState, useRef } from 'react'
import { X, Loader2, Mail, Phone, Briefcase, User, FileText, Gift, Clock, StickyNote, Sparkles } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

import { mockDb } from '@/lib/mockDb'
import type { Application, Activity, Note } from '@/types/ats'
import { ACTIVITY_LABELS, getAvatarColor, getInitials } from '@/types/ats'
import { computeAiScore } from '@/lib/aiEngine'
import { AiScoreRing } from './AiScoreRing'
import { SkillPills } from './SkillPills'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// ── Props ─────────────────────────────────────────────────────

interface Props {
  applicationId: string | null
  open: boolean
  onClose: () => void
  defaultTab?: 'overview' | 'activity' | 'notes' | 'email' | 'offer'
}

type Tab = 'overview' | 'activity' | 'notes' | 'email' | 'offer'

// ── Tab config ────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Overview',  icon: <User className="size-3.5" />       },
  { id: 'activity',  label: 'Activity',  icon: <Clock className="size-3.5" />      },
  { id: 'notes',     label: 'Notes',     icon: <StickyNote className="size-3.5" /> },
  { id: 'email',     label: 'Email',     icon: <Mail className="size-3.5" />       },
  { id: 'offer',     label: 'Offer',     icon: <Gift className="size-3.5" />       },
]

// ── Activity icon helper ──────────────────────────────────────

function activityIcon(type: string) {
  switch (type) {
    case 'created':       return <User className="size-3.5 text-[#40826D]" />
    case 'stage_moved':   return <Briefcase className="size-3.5 text-blue-500" />
    case 'note_added':    return <StickyNote className="size-3.5 text-amber-500" />
    case 'email_sent':    return <Mail className="size-3.5 text-violet-500" />
    case 'ai_scored':     return <Sparkles className="size-3.5 text-[#40826D]" />
    case 'offer_created': return <Gift className="size-3.5 text-amber-500" />
    default:              return <Clock className="size-3.5 text-gray-400" />
  }
}

// ── Score breakdown bar ───────────────────────────────────────

function ScoreBar({
  label, earned, max, rationale,
}: {
  label: string
  earned: number
  max: number
  rationale: string
}) {
  const pct = Math.round((earned / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{earned}/{max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#40826D]/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#40826D] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">{rationale}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function CandidateDetailPanel({
  applicationId,
  open,
  onClose,
  defaultTab = 'overview',
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)
  const [app, setApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const prevAppId = useRef<string | null>(null)

  // Sync active tab when caller switches quick-action
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab, applicationId])

  // Fetch application when applicationId changes
  useEffect(() => {
    if (!applicationId || applicationId === prevAppId.current) return
    prevAppId.current = applicationId
    let cancelled = false

    setLoading(true)
    setApp(null)
    setActivities([])
    setNotes([])

    const data = mockDb.getApplicationById(applicationId)
    if (!cancelled) {
      if (data) setApp(data as unknown as Application)
      setLoading(false)
    }

    return () => { cancelled = true }
  }, [applicationId])

  useEffect(() => {
    if (activeTab !== 'activity' || !applicationId) return
    setActivities(mockDb.getActivities(applicationId) as unknown as Activity[])
  }, [activeTab, applicationId])

  useEffect(() => {
    if (activeTab !== 'notes' || !applicationId) return
    setNotes(mockDb.getNotes(applicationId) as unknown as Note[])
  }, [activeTab, applicationId])

  // Reset tracking ref when panel closes
  useEffect(() => {
    if (!open) prevAppId.current = null
  }, [open])

  async function handleAddNote() {
    if (!noteText.trim() || !applicationId) return
    setAddingNote(true)
    const note = mockDb.addNote(applicationId, noteText.trim())
    setNotes(prev => [note as unknown as Note, ...prev])
    setNoteText('')
    setAddingNote(false)
  }

  if (!applicationId) return null

  const candidate   = app?.candidate
  const job         = app?.job
  const stage       = app?.current_stage
  const skills      = candidate?.parsed_data?.skills ?? []
  const aiResult    = candidate && job
    ? computeAiScore(candidate, job.title, stage?.name)
    : null
  const avatarColor = candidate
    ? getAvatarColor(candidate.full_name)
    : { bg: 'bg-[#D6EDE7]', text: 'text-[#245849]' }
  const initials    = candidate ? getInitials(candidate.full_name) : '?'

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-[560px] flex-col',
          'bg-white shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-label="Candidate detail panel"
      >
        {/* ── Header ── */}
        <div className="flex items-start gap-3 border-b border-border px-5 py-4 bg-[#F5FAF8]">
          {loading ? (
            <div className="flex flex-1 items-center gap-3">
              <div className="size-11 rounded-full bg-[#D6EDE7] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-[#D6EDE7] animate-pulse" />
                <div className="h-3 w-56 rounded bg-[#D6EDE7] animate-pulse" />
              </div>
            </div>
          ) : candidate ? (
            <div className="flex flex-1 items-start gap-3 min-w-0">
              <Avatar className="size-11 shrink-0">
                <AvatarFallback className={cn('text-sm font-bold', avatarColor.bg, avatarColor.text)}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">{candidate.full_name}</h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  {job && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Briefcase className="size-3 shrink-0" />
                      {job.title}
                    </span>
                  )}
                  {stage && (
                    <span className="rounded-full bg-[#D6EDE7] px-2 py-0.5 text-[10px] font-semibold text-[#245849]">
                      {stage.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#D6EDE7] hover:text-[#245849]"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border bg-[#F5FAF8] px-5 gap-0.5 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap',
                'border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-[#40826D] text-[#245849]'
                  : 'border-transparent text-muted-foreground hover:text-[#245849] hover:border-[#40826D]/30',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-[#40826D]" />
            </div>
          ) : !app || !candidate ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
              <User className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Could not load candidate data.</p>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {activeTab === 'overview' && (
                <div className="space-y-5 p-5">
                  {/* Score ring + contact info */}
                  <div className="flex items-start gap-5">
                    {aiResult && (
                      <AiScoreRing score={aiResult.total} grade={aiResult.grade} size={88} />
                    )}
                    <div className="flex-1 min-w-0 space-y-2 pt-1">
                      <a
                        href={`mailto:${candidate.email}`}
                        className="flex items-center gap-2 text-sm text-[#245849] hover:underline truncate"
                      >
                        <Mail className="size-3.5 shrink-0 text-[#40826D]" />
                        {candidate.email}
                      </a>
                      {candidate.phone && (
                        <a
                          href={`tel:${candidate.phone}`}
                          className="flex items-center gap-2 text-sm text-[#245849] hover:underline"
                        >
                          <Phone className="size-3.5 shrink-0 text-[#40826D]" />
                          {candidate.phone}
                        </a>
                      )}
                      {candidate.parsed_data?.experience_years != null && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="size-3.5 shrink-0 text-[#40826D]" />
                          {candidate.parsed_data.experience_years} year{candidate.parsed_data.experience_years !== 1 ? 's' : ''} experience
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {candidate.parsed_data?.summary && (
                    <div className="rounded-xl border border-[#40826D]/20 bg-[#F5FAF8] p-3.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#40826D] mb-1.5">Summary</p>
                      <p className="text-sm text-foreground leading-relaxed">{candidate.parsed_data.summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#40826D] mb-2">Skills</p>
                      <SkillPills skills={skills} max={12} />
                    </div>
                  )}

                  {/* Score breakdown */}
                  {aiResult && aiResult.breakdown.length > 0 && (
                    <div className="rounded-xl border border-[#40826D]/20 bg-[#F5FAF8] p-4 space-y-4">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-[#40826D]" />
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#40826D]">
                          AI Score Breakdown
                        </p>
                      </div>
                      <div className="space-y-3.5">
                        {aiResult.breakdown.map(b => (
                          <ScoreBar
                            key={b.category}
                            label={b.category}
                            earned={b.earned}
                            max={b.max}
                            rationale={b.rationale}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ACTIVITY ── */}
              {activeTab === 'activity' && (
                <div className="p-5">
                  {activities.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                      <Clock className="size-8 opacity-30" />
                      <p className="text-sm">No activity recorded yet.</p>
                    </div>
                  ) : (
                    <ol className="relative space-y-0 border-l border-[#40826D]/20 ml-2">
                      {activities.map(act => {
                        const label = ACTIVITY_LABELS[act.type as keyof typeof ACTIVITY_LABELS] ?? act.type
                        const meta = act.metadata as Record<string, string>
                        let detail = ''
                        if (act.type === 'stage_moved' && meta.to_stage) {
                          detail = `to ${meta.to_stage}`
                        } else if (act.type === 'email_sent' && meta.email_subject) {
                          detail = meta.email_subject
                        } else if (act.type === 'note_added' && meta.note_preview) {
                          detail = meta.note_preview
                        }

                        return (
                          <li key={act.id} className="ml-5 pb-5">
                            <div className="absolute -left-[9px] mt-1 flex size-[18px] items-center justify-center rounded-full border border-[#40826D]/30 bg-white">
                              {activityIcon(act.type)}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-foreground">{label}</span>
                              {detail && (
                                <span className="text-xs text-muted-foreground truncate">{detail}</span>
                              )}
                              <time className="text-[10px] text-muted-foreground/70">
                                {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                              </time>
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </div>
              )}

              {/* ── NOTES ── */}
              {activeTab === 'notes' && (
                <div className="flex flex-col gap-4 p-5">
                  {/* Compose */}
                  <div className="rounded-xl border border-[#40826D]/20 bg-[#F5FAF8] p-3.5 space-y-2.5">
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add a note about this candidate..."
                      rows={3}
                      className={cn(
                        'w-full resize-none rounded-lg border border-[#40826D]/20 bg-white p-2.5 text-sm',
                        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#40826D]/30',
                      )}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddNote}
                        disabled={!noteText.trim() || addingNote}
                        className={cn(
                          'rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors',
                          'bg-[#40826D] text-white hover:bg-[#245849]',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                        )}
                      >
                        {addingNote ? 'Saving…' : 'Add Note'}
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  {notes.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                      <StickyNote className="size-8 opacity-30" />
                      <p className="text-sm">No notes yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map(note => (
                        <div
                          key={note.id}
                          className="rounded-xl border border-[#40826D]/15 bg-[#F5FAF8] p-3.5"
                        >
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {note.content}
                          </p>
                          <time className="mt-1.5 block text-[10px] text-muted-foreground/70">
                            {format(new Date(note.created_at), 'MMM d, yyyy · h:mm a')}
                          </time>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── EMAIL ── */}
              {activeTab === 'email' && (
                <div className="p-5 space-y-4">
                  <div className="rounded-xl border border-[#40826D]/20 bg-[#F5FAF8] p-4 space-y-3">
                    {/* To */}
                    <div className="flex items-center gap-2 border-b border-[#40826D]/10 pb-3">
                      <span className="w-14 text-xs font-semibold text-[#40826D]">To</span>
                      <span className="text-sm text-foreground">{candidate.email}</span>
                    </div>

                    {/* Subject */}
                    <div className="flex items-center gap-2 border-b border-[#40826D]/10 pb-3">
                      <span className="w-14 text-xs font-semibold text-[#40826D]">Subject</span>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)}
                        placeholder="Enter subject…"
                        className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>

                    {/* Body */}
                    <textarea
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      placeholder={`Write your message to ${candidate.full_name}…`}
                      rows={8}
                      className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <FileText className="size-3 shrink-0" />
                      Preview only — sending requires an email integration.
                    </p>
                    <button
                      disabled
                      className="rounded-lg bg-[#40826D]/40 px-4 py-1.5 text-xs font-semibold text-white cursor-not-allowed whitespace-nowrap"
                    >
                      Send Email
                    </button>
                  </div>
                </div>
              )}

              {/* ── OFFER ── */}
              {activeTab === 'offer' && (
                <div className="p-5">
                  <div className="flex flex-col items-center gap-5 py-10 text-center">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100 shadow-md shadow-amber-100">
                      <Gift className="size-8 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Generate an Offer</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground max-w-xs leading-relaxed">
                        Create a formal offer letter for{' '}
                        <span className="font-medium text-foreground">{candidate.full_name}</span>{' '}
                        for the{' '}
                        <span className="font-medium text-foreground">{job?.title ?? 'role'}</span>{' '}
                        position.
                      </p>
                    </div>
                    <button
                      className={cn(
                        'flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm transition-all',
                        'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900',
                        'shadow-md shadow-amber-200 hover:shadow-lg hover:shadow-amber-300/60 hover:scale-[1.02]',
                      )}
                    >
                      <Gift className="size-4" />
                      Generate Offer Letter
                    </button>
                    <p className="text-xs text-muted-foreground">
                      The candidate will receive an acceptance link at{' '}
                      <span className="font-medium">{candidate.email}</span>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  )
}
