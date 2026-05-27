/**
 * Pipeline Settings — per-job stage customisation
 * Route: /settings/pipeline
 *
 * Features:
 * - Pick any job
 * - Add / rename / delete stages
 * - Reorder via drag-and-drop
 * - Choose a colour for each stage
 * - Save persists to pipeline_stages in Supabase
 * - Changes immediately reflected on the kanban board
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Loader2, Plus, Trash2, GripVertical,
  Check, AlertCircle, Sparkles, Edit3, ChevronRight,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { mockDb } from '@/lib/mockDb'
import { useJobs } from '@/hooks/useJobLifecycle'
import { DEFAULT_STAGES } from '@/types/ats'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Stage colours ─────────────────────────────────────────────

export const STAGE_COLORS: { id: string; label: string; bg: string; text: string; ring: string }[] = [
  { id: 'violet', label: 'Violet',  bg: 'bg-violet-100',  text: 'text-violet-700',  ring: 'ring-violet-400' },
  { id: 'blue',   label: 'Blue',    bg: 'bg-blue-100',    text: 'text-blue-700',    ring: 'ring-blue-400' },
  { id: 'cyan',   label: 'Cyan',    bg: 'bg-cyan-100',    text: 'text-cyan-700',    ring: 'ring-cyan-400' },
  { id: 'emerald',label: 'Green',   bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-400' },
  { id: 'amber',  label: 'Amber',   bg: 'bg-amber-100',   text: 'text-amber-700',   ring: 'ring-amber-400' },
  { id: 'orange', label: 'Orange',  bg: 'bg-orange-100',  text: 'text-orange-700',  ring: 'ring-orange-400' },
  { id: 'rose',   label: 'Rose',    bg: 'bg-rose-100',    text: 'text-rose-700',    ring: 'ring-rose-400' },
  { id: 'gray',   label: 'Gray',    bg: 'bg-gray-100',    text: 'text-gray-600',    ring: 'ring-gray-400' },
]

export function getStageColor(colorId?: string | null) {
  return STAGE_COLORS.find(c => c.id === colorId) ?? STAGE_COLORS[0]
}

// ── Local stage type (before/after save) ─────────────────────

interface EditableStage {
  id: string          // real DB id OR temp id (starts with 'new-')
  name: string
  order_index: number
  color: string
  isNew: boolean
  toDelete: boolean
}

// ── Main component ─────────────────────────────────────────────

export default function PipelineSettings() {
  const navigate = useNavigate()
  const { jobs, loading: jobsLoading } = useJobs()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [stages, setStages] = useState<EditableStage[]>([])
  const [loadingStages, setLoadingStages] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Drag state
  const dragIdx = useRef<number | null>(null)

  // Load stages when a job is selected
  useEffect(() => {
    if (!selectedJobId) return
    setLoadingStages(true)
    const data = mockDb.getStages(selectedJobId)
    if (data.length > 0) {
      setStages(data.map(s => ({ id: s.id, name: s.name, order_index: s.order_index, color: s.color ?? 'violet', isNew: false, toDelete: false })))
    } else {
      setStages(DEFAULT_STAGES.map((s, i) => ({ id: `new-${i}`, name: s.name, order_index: i, color: 'violet', isNew: true, toDelete: false })))
    }
    setDirty(false)
    setLoadingStages(false)
  }, [selectedJobId])

  // ── Stage mutation helpers ──────────────────────────────────

  function patch(id: string, update: Partial<EditableStage>) {
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...update } : s))
    setDirty(true)
  }

  function addStage() {
    const active = stages.filter(s => !s.toDelete)
    const newStage: EditableStage = {
      id:          `new-${Date.now()}`,
      name:        'New Stage',
      order_index: active.length,
      color:       'violet',
      isNew:       true,
      toDelete:    false,
    }
    setStages(prev => [...prev, newStage])
    setDirty(true)
  }

  function removeStage(id: string) {
    const s = stages.find(s => s.id === id)
    if (!s) return
    if (s.isNew) {
      // Never saved — just remove from local list
      setStages(prev => prev.filter(s => s.id !== id))
    } else {
      // Mark for deletion
      patch(id, { toDelete: true })
    }
    setDirty(true)
  }

  // ── Drag-and-drop reorder ──────────────────────────────────

  function onDragStart(idx: number) { dragIdx.current = idx }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    const from = dragIdx.current
    if (from === null || from === idx) return
    setStages(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(idx, 0, item)
      dragIdx.current = idx
      return next.map((s, i) => ({ ...s, order_index: i }))
    })
    setDirty(true)
  }

  function onDragEnd() { dragIdx.current = null }

  // ── Save to Supabase ──────────────────────────────────────

  async function handleSave() {
    if (!selectedJobId) return
    setSaving(true)

    const active = stages.filter(s => !s.toDelete)

    const upserted = mockDb.upsertStages(
      selectedJobId,
      active.map((s, i) => ({
        id:          s.isNew ? `${selectedJobId}-s-${Date.now()}-${i}` : s.id,
        job_id:      selectedJobId,
        name:        s.name,
        order_index: i,
        color:       s.color,
      }))
    )

    setStages(upserted.map(s => ({ id: s.id, name: s.name, order_index: s.order_index, color: s.color ?? 'violet', isNew: false, toDelete: false })))

    setDirty(false)
    setSaving(false)
    toast.success('Pipeline stages saved!')
  }

  const selectedJob  = jobs.find(j => j.id === selectedJobId)
  const visibleStages = stages.filter(s => !s.toDelete)

  return (
    <AppShell>
      <div className="h-full flex flex-col overflow-hidden">

        {/* Header */}
        <div className="border-b bg-background px-8 py-5 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <button
              onClick={() => navigate('/settings')}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="size-3" /> Settings
            </button>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">Pipeline Customisation</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-foreground">Pipeline Customisation</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure hiring stages for each job. Changes reflect immediately on the kanban board.
              </p>
            </div>
            {selectedJobId && dirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors shadow-md shadow-violet-200"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Left: job list */}
          <div className="w-72 shrink-0 border-r flex flex-col bg-background overflow-y-auto">
            <div className="px-5 py-4 border-b">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select a Job</p>
            </div>
            {jobsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-violet-500" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <AlertCircle className="size-6 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No jobs yet. Create a job first.</p>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {jobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={cn(
                      'w-full text-left rounded-xl px-4 py-3 transition-colors',
                      selectedJobId === job.id
                        ? 'bg-violet-50 border border-violet-200'
                        : 'hover:bg-muted border border-transparent',
                    )}
                  >
                    <p className={cn(
                      'text-sm font-semibold leading-tight',
                      selectedJobId === job.id ? 'text-violet-700' : 'text-foreground',
                    )}>
                      {job.title}
                    </p>
                    {job.department && (
                      <p className="text-xs text-muted-foreground mt-0.5">{job.department}</p>
                    )}
                    <span className={cn(
                      'mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold',
                      job.status === 'published' || job.status === 'open'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500',
                    )}>
                      {job.status === 'published' || job.status === 'open' ? 'Active' : job.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: stage editor */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {!selectedJobId ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-100">
                  <Sparkles className="size-7 text-violet-600" />
                </div>
                <p className="text-lg font-bold text-foreground">Select a job to customise its pipeline</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Each job can have its own unique hiring stages — rename, reorder, add or remove them freely.
                </p>
              </div>
            ) : loadingStages ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="size-6 animate-spin text-violet-500" />
              </div>
            ) : (
              <div className="max-w-xl space-y-6">

                {/* Job title */}
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedJob?.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {visibleStages.length} stage{visibleStages.length !== 1 ? 's' : ''}
                    {dirty && <span className="ml-2 text-amber-600 font-semibold">· Unsaved changes</span>}
                  </p>
                </div>

                {/* Stage list */}
                <div className="space-y-2">
                  {visibleStages.map((stage, idx) => (
                    <StageRow
                      key={stage.id}
                      stage={stage}
                      idx={idx}
                      total={visibleStages.length}
                      onRename={name => patch(stage.id, { name })}
                      onColorChange={color => patch(stage.id, { color })}
                      onDelete={() => removeStage(stage.id)}
                      onDragStart={() => onDragStart(idx)}
                      onDragOver={e => onDragOver(e, idx)}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>

                {/* Add stage */}
                <button
                  onClick={addStage}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/40 transition-colors"
                >
                  <Plus className="size-4" /> Add Stage
                </button>

                {/* Info banner */}
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 flex items-start gap-3">
                  <AlertCircle className="size-4 text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-700 leading-relaxed">
                    Deleting a stage will move any candidates currently in that stage to <strong>unassigned</strong>. You can reassign them from the pipeline board.
                  </p>
                </div>

                {/* Save footer */}
                {dirty && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSelectedJobId(prev => { setDirty(false); return prev })}
                      className="rounded-xl border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                      disabled={saving}
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors shadow-md shadow-violet-200"
                    >
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ── StageRow ──────────────────────────────────────────────────

interface StageRowProps {
  stage: EditableStage
  idx: number
  total: number
  onRename: (name: string) => void
  onColorChange: (color: string) => void
  onDelete: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function StageRow({
  stage, idx, total,
  onRename, onColorChange, onDelete,
  onDragStart, onDragOver, onDragEnd,
}: StageRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stage.name)
  const [showColors, setShowColors] = useState(false)
  const colorRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const col = getStageColor(stage.color)

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed) onRename(trimmed)
    else setDraft(stage.name)
    setEditing(false)
  }

  // Close color picker on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColors(false)
    }
    if (showColors) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showColors])

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:shadow-sm transition-shadow cursor-grab active:cursor-grabbing group"
    >
      {/* Drag handle */}
      <GripVertical className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />

      {/* Step number */}
      <span className="text-xs font-black text-muted-foreground/40 w-5 shrink-0">{idx + 1}</span>

      {/* Color dot + picker */}
      <div className="relative shrink-0" ref={colorRef}>
        <button
          onClick={() => setShowColors(v => !v)}
          title="Change colour"
          className={cn(
            'flex size-7 items-center justify-center rounded-full transition-all ring-2 ring-offset-1',
            col.bg,
            showColors ? col.ring : 'ring-transparent hover:ring-2 hover:' + col.ring,
          )}
        >
          <span className={cn('text-[10px] font-bold', col.text)}>●</span>
        </button>
        {showColors && (
          <div className="absolute left-0 top-9 z-20 rounded-xl border bg-popover shadow-xl p-3 w-44">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Stage colour</p>
            <div className="grid grid-cols-4 gap-2">
              {STAGE_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onColorChange(c.id); setShowColors(false) }}
                  title={c.label}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full transition-all ring-2 ring-offset-1',
                    c.bg,
                    stage.color === c.id ? c.ring : 'ring-transparent hover:' + c.ring,
                  )}
                >
                  {stage.color === c.id && <Check className={cn('size-3', c.text)} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Name — editable inline */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') { setDraft(stage.name); setEditing(false) }
            }}
            className="w-full rounded-lg border bg-background px-2.5 py-1 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-violet-200"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{stage.name}</span>
            {stage.isNew && (
              <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-600">NEW</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => { setDraft(stage.name); setEditing(true) }}
          title="Rename"
          className="flex size-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Edit3 className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={total <= 1}
          title={total <= 1 ? 'At least one stage required' : 'Delete stage'}
          className="flex size-7 items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
