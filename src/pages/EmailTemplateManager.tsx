/**
 * Email Template Manager — Viridian + Claymorphism design
 * Route: /email-templates
 */
import { useState, useRef, useEffect } from 'react'
import {
  Sparkles, Clock, AlertCircle, Eye, EyeOff, Save, Plus, X,
  Bold, Italic, List, Link2, Trash2, Edit3, Check, ChevronDown,
  Copy, ExternalLink, Share2,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Design tokens ──────────────────────────────────────────────
const V = {
  primary:    '#40826D',
  dark:       '#2F6F5E',
  bg:         '#EEF6F3',
  bgLight:    '#D6EDE7',
  border:     '#B0D9CF',
  text:       '#1F2D2A',
  muted:      '#6B7C77',
  cardBg:     'hsl(152,14%,96%)',
  cardBorder: 'hsl(150,16%,87%)',
}

// ── Types ─────────────────────────────────────────────────────

interface Placeholder {
  key: string
  label: string
}

interface Template {
  id: string
  name: string
  badge: string | null
  subject: string
  body: string
  placeholders: Placeholder[]
  isWarning: boolean
  updatedAt: Date
}

// ── Default placeholders ───────────────────────────────────────

const SYSTEM_PLACEHOLDERS: Placeholder[] = [
  { key: '{{candidate_name}}',  label: 'Candidate Name' },
  { key: '{{role}}',            label: 'Job Role' },
  { key: '{{company}}',         label: 'Company Name' },
  { key: '{{recruiter_name}}',  label: 'Recruiter Name' },
  { key: '{{schedule_link}}',   label: 'Schedule Link' },
  { key: '{{start_date}}',      label: 'Start Date' },
  { key: '{{salary}}',          label: 'Salary' },
  { key: '{{interview_date}}',  label: 'Interview Date' },
  { key: '{{interview_time}}',  label: 'Interview Time' },
  { key: '{{offer_link}}',      label: 'Offer Link' },
]

// ── Seed templates ────────────────────────────────────────────

function seedTemplates(): Template[] {
  return [
    {
      id: 'tpl-1',
      name: 'Initial Outreach',
      badge: 'CORE',
      subject: 'Exciting Opportunity: {{role}} at {{company}}',
      body: `Hi {{candidate_name}},\n\nI came across your background while researching for our {{role}} position at {{company}}, and I was particularly impressed by your experience.\n\nWe're building the next generation of AI-native products, and I believe your expertise would be a perfect fit for the team.\n\nWould you be open to a 15-minute introductory chat this week?\n\nBest regards,\n{{recruiter_name}}`,
      placeholders: [],
      isWarning: false,
      updatedAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
    {
      id: 'tpl-2',
      name: 'Interview Invitation',
      badge: null,
      subject: 'Interview Invitation — {{role}} at {{company}}',
      body: `Hi {{candidate_name}},\n\nCongratulations! We were impressed with your profile and would love to move forward with a {{role}} interview at {{company}}.\n\nThe session will be approximately 60 minutes and will cover:\n- Technical / role-specific questions\n- Your experience and background\n- Culture and team fit\n\nPlease use the link below to select a time that works for you:\n{{schedule_link}}\n\nInterview Date: {{interview_date}}\nInterview Time: {{interview_time}}\n\nLooking forward to speaking with you,\n{{recruiter_name}}`,
      placeholders: [],
      isWarning: false,
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
    {
      id: 'tpl-3',
      name: 'Offer Letter Follow-up',
      badge: null,
      subject: 'Your Offer from {{company}} — Next Steps',
      body: `Hi {{candidate_name}},\n\nWe are thrilled to follow up on the offer we extended for the {{role}} position at {{company}}.\n\nPlease review the attached offer letter and let us know if you have any questions. We would love to have you join the team!\n\nStart Date: {{start_date}}\nSalary: {{salary}}\n\nTo review and sign your offer, please click here: {{offer_link}}\n\nBest,\n{{recruiter_name}}`,
      placeholders: [],
      isWarning: false,
      updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    },
    {
      id: 'tpl-4',
      name: 'Rejection — Post Interview',
      badge: null,
      subject: 'Re: Your Application for {{role}} at {{company}}',
      body: `Hi {{candidate_name}},\n\nThank you so much for taking the time to interview with us for the {{role}} position at {{company}}. We genuinely enjoyed learning more about your background and experience.\n\nAfter careful consideration, we have decided to move forward with another candidate whose background more closely aligns with our current needs.\n\nWe encourage you to apply for future openings and wish you the very best in your search.\n\nWarm regards,\n{{recruiter_name}}`,
      placeholders: [],
      isWarning: false,
      updatedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    },
  ]
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

// ── Main component ─────────────────────────────────────────────

export default function EmailTemplates() {
  const [templates, setTemplates]       = useState<Template[]>(seedTemplates)
  const [selectedId, setSelectedId]     = useState(templates[0].id)
  const [previewMode, setPreviewMode]   = useState(false)
  const [newPlaceholderKey, setNewPlaceholderKey] = useState('')
  const [showPlaceholderForm, setShowPlaceholderForm] = useState(false)
  const [editingName, setEditingName]   = useState(false)
  const [showCustomPh, setShowCustomPh] = useState(false)
  const [phDropdownPos, setPhDropdownPos] = useState<{ top: number; left: number } | null>(null)
  const [previewLink, setPreviewLink]   = useState<string | null>(null)
  const [linkCopied, setLinkCopied]     = useState(false)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const subjectRef   = useRef<HTMLInputElement>(null)
  const savedSel     = useRef<{ start: number; end: number }>({ start: 0, end: 0 })
  const phBtnRef     = useRef<HTMLButtonElement>(null)

  // Close dropdown on outside click
  // Close dropdown on outside click
  useEffect(() => {
    if (!showCustomPh) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const inBtn    = phBtnRef.current?.contains(target)
      const inPortal = document.querySelector('[data-ph-dropdown="true"]')?.contains(target)
      if (!inBtn && !inPortal) setShowCustomPh(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showCustomPh])
  function captureSelection() {
    const el = textareaRef.current
    if (el) savedSel.current = { start: el.selectionStart, end: el.selectionEnd }
  }

  const selected = templates.find(t => t.id === selectedId)!

  function updateSelected(patch: Partial<Template>) {
    setTemplates(prev =>
      prev.map(t => t.id === selectedId ? { ...t, ...patch, updatedAt: new Date() } : t)
    )
  }

  function handleSave() {
    updateSelected({})
    toast.success(`"${selected.name}" saved successfully`)
  }

  function createTemplate() {
    const newTpl: Template = {
      id: `tpl-${Date.now()}`,
      name: 'New Template',
      badge: null,
      subject: 'Subject line — {{role}} at {{company}}',
      body: `Hi {{candidate_name}},\n\n[Write your message here]\n\nBest regards,\n{{recruiter_name}}`,
      placeholders: [],
      isWarning: false,
      updatedAt: new Date(),
    }
    setTemplates(prev => [...prev, newTpl])
    setSelectedId(newTpl.id)
    setEditingName(true)
  }

  function deleteTemplate(id: string) {
    const remaining = templates.filter(t => t.id !== id)
    setTemplates(remaining)
    if (selectedId === id && remaining.length > 0) setSelectedId(remaining[0].id)
    toast.success('Template deleted')
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current
    const { start, end } = savedSel.current
    const body = selected.body
    const newBody = body.slice(0, start) + text + body.slice(end)
    updateSelected({ body: newBody })
    const newPos = start + text.length
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(newPos, newPos)
      savedSel.current = { start: newPos, end: newPos }
    })
  }

  function wrapSelection(before: string, after: string) {
    const el = textareaRef.current
    const { start, end } = savedSel.current
    const body = selected.body
    const sel = body.slice(start, end)
    const wrapped = before + sel + after
    const newBody = body.slice(0, start) + wrapped + body.slice(end)
    updateSelected({ body: newBody })
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + sel.length)
      savedSel.current = { start: start + before.length, end: start + before.length + sel.length }
    })
  }

  function insertPlaceholder(key: string) { insertAtCursor(key) }

  function addCustomPlaceholder() {
    const k = newPlaceholderKey.trim()
    if (!k) return
    const key   = k.startsWith('{{') ? k : `{{${k.replace(/\s+/g, '_').toLowerCase()}}}`
    const label = k
    const already = selected.placeholders.find(p => p.key === key)
    if (!already) updateSelected({ placeholders: [...selected.placeholders, { key, label }] })
    insertPlaceholder(key)
    setNewPlaceholderKey('')
    setShowPlaceholderForm(false)
    toast.success(`Placeholder ${key} added`)
  }

  function removeCustomPlaceholder(key: string) {
    updateSelected({ placeholders: selected.placeholders.filter(p => p.key !== key) })
  }

  const allPlaceholders = [...SYSTEM_PLACEHOLDERS, ...selected.placeholders]

  function renderPreview(text: string) {
    return text.replace(/\{\{(\w+)\}\}/g, (match) => {
      const ph = allPlaceholders.find(p => p.key === match)
      return ph ? `[${ph.label}]` : match
    })
  }

  function generatePreviewLink() {
    const payload = {
      name:    selected.name,
      subject: selected.subject,
      body:    selected.body,
      badge:   selected.badge,
    }
    const token = btoa(encodeURIComponent(JSON.stringify(payload)))
    const url = `${window.location.origin}/email-preview/${token}`
    setPreviewLink(url)
    setLinkCopied(false)
  }

  async function copyLink() {
    if (!previewLink) return
    await navigator.clipboard.writeText(previewLink)
    setLinkCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setLinkCopied(false), 2000)
  }


  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">

        {/* ── Left panel: template list ── */}
        <div className="w-72 shrink-0 border-r flex flex-col" style={{ background: V.cardBg, borderColor: V.cardBorder }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: V.cardBorder }}>
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: V.muted }}>Templates</h2>
            <button
              onClick={createTemplate}
              className="flex size-7 items-center justify-center rounded-lg text-white transition-all"
              style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})`, boxShadow: '3px 3px 8px rgba(64,130,109,0.25),-2px -2px 5px rgba(255,255,255,0.4)' }}
              title="New Template"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => { setSelectedId(tpl.id); setPreviewMode(false) }}
                className="w-full rounded-xl p-4 text-left transition-all group relative"
                style={selectedId === tpl.id ? {
                  background: V.bg,
                  border: `1px solid ${V.border}`,
                  boxShadow: '3px 3px 8px rgba(64,130,109,0.10),-2px -2px 6px rgba(255,255,255,0.65)',
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => { if (selectedId !== tpl.id) (e.currentTarget as HTMLElement).style.background = V.bg }}
                onMouseLeave={e => { if (selectedId !== tpl.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-sm font-semibold line-clamp-1', tpl.isWarning ? 'text-amber-700' : 'text-foreground')}>
                    {tpl.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {tpl.isWarning && <AlertCircle className="size-3.5 text-amber-500 shrink-0" />}
                    {tpl.badge && (
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                        style={{ background: V.bgLight, color: V.dark }}>
                        {tpl.badge}
                      </span>
                    )}
                    {selectedId === tpl.id && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteTemplate(tpl.id) }}
                        className="flex size-5 items-center justify-center rounded hover:bg-red-100 hover:text-red-500 text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete template"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{tpl.subject}</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                  <Clock className="size-2.5" />
                  <span>Updated {timeAgo(tpl.updatedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: editor / preview ── */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* Header */}
          <div className="border-b px-7 py-4 flex items-center justify-between bg-background shrink-0" style={{ borderColor: V.cardBorder }}>
            <div className="flex items-center gap-3 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={selected.name}
                    onChange={e => updateSelected({ name: e.target.value })}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                    className="text-xl font-black text-foreground bg-transparent border-b-2 outline-none w-60"
                    style={{ borderColor: V.primary }}
                  />
                  <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground">
                    <Check className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-foreground truncate">{selected.name}</h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="flex size-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
                    title="Rename template"
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle edit / preview */}
              <button
                onClick={() => setPreviewMode(v => !v)}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
                style={previewMode ? {
                  borderColor: V.border, background: V.bg, color: V.dark,
                } : {
                  borderColor: V.cardBorder, color: V.muted,
                }}
                onMouseEnter={e => { if (!previewMode) { const el = e.currentTarget as HTMLElement; el.style.borderColor = V.border; el.style.background = V.bg; el.style.color = V.dark } }}
                onMouseLeave={e => { if (!previewMode) { const el = e.currentTarget as HTMLElement; el.style.borderColor = V.cardBorder; el.style.background = ''; el.style.color = V.muted } }}
              >
                {previewMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {previewMode ? 'Edit' : 'Preview'}
              </button>

              {/* Generate preview link */}
              <button
                onClick={generatePreviewLink}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all"
                style={{ borderColor: V.border, background: V.bg, color: V.dark }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = V.border }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = V.bg }}
                title="Generate a shareable preview link"
              >
                <Share2 className="size-4" /> Share Preview
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all"
                style={{
                  background: `linear-gradient(135deg,${V.primary},${V.dark})`,
                  boxShadow: '4px 4px 10px rgba(64,130,109,0.25),-3px -3px 8px rgba(255,255,255,0.55)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
              >
                <Save className="size-4" /> Save Changes
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">

            {/* Editor / preview body */}
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

              {/* Subject line */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subject Line</label>
                {previewMode ? (
                  <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm font-medium text-foreground" style={{ borderColor: V.cardBorder }}>
                    {renderPreview(selected.subject)}
                  </div>
                ) : (
                  <input
                    ref={subjectRef}
                    value={selected.subject}
                    onChange={e => updateSelected({ subject: e.target.value })}
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none transition"
                    style={{ borderColor: V.cardBorder }}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = V.border }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = V.cardBorder }}
                    placeholder="Email subject line..."
                  />
                )}
              </div>

              {/* Body editor with toolbar */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Body</label>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: V.cardBorder }}>
                  {!previewMode && (
                    <div className="flex items-center gap-1 border-b px-3 py-2 flex-wrap" style={{ background: V.cardBg, borderColor: V.cardBorder }}>
                      <ToolbarBtn icon={Bold}   title="Bold"   onMouseDown={() => wrapSelection('**', '**')} />
                      <ToolbarBtn icon={Italic} title="Italic" onMouseDown={() => wrapSelection('_', '_')} />
                      <ToolbarBtn icon={List}   title="List"   onMouseDown={() => wrapSelection('\n- ', '')} />
                      <ToolbarBtn icon={Link2}  title="Link"   onMouseDown={() => wrapSelection('[', '](url)')} />
                      <div className="h-4 w-px bg-border mx-1" />

                      {/* Placeholder dropdown — fixed position to escape overflow-hidden */}
                      <div data-ph-dropdown="true">
                        <button
                          ref={phBtnRef}
                          type="button"
                          onMouseDown={e => {
                            captureSelection()
                            e.preventDefault()
                            if (!showCustomPh && phBtnRef.current) {
                              const rect = phBtnRef.current.getBoundingClientRect()
                              setPhDropdownPos({ top: rect.bottom + 6, left: rect.left })
                            }
                            setShowCustomPh(v => !v)
                          }}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors"
                          style={{ background: V.bgLight, color: V.dark }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = V.border }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = V.bgLight }}
                        >
                          <Plus className="size-3" /> Insert Placeholder
                          <ChevronDown className="size-3" />
                        </button>
                      </div>

                    </div>
                  )}
                  {previewMode ? (
                    <div className="px-5 py-5 min-h-[320px]">
                      <pre className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                        {renderPreview(selected.body)}
                      </pre>
                    </div>
                  ) : (
                    <textarea
                      value={selected.body}
                      onChange={e => updateSelected({ body: e.target.value })}
                      onSelect={captureSelection}
                      onKeyUp={captureSelection}
                      onClick={captureSelection}
                      rows={18}
                      className="w-full resize-y bg-transparent px-5 py-4 text-sm leading-relaxed focus:outline-none font-mono min-h-[320px]"
                      placeholder="Write your email template here. Use placeholders like {{candidate_name}} to personalise..."
                    />
                  )}
                </div>
              </div>

              {/* AI Copywriting */}
              <div className="flex items-center gap-4 rounded-2xl border p-4"
                style={{ borderColor: V.border, background: V.bg }}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})`, boxShadow: '4px 4px 10px rgba(64,130,109,0.25)' }}>
                  <Sparkles className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: V.text }}>AI Copywriting Assistant</p>
                  <p className="text-xs" style={{ color: V.muted }}>Rewrite, shorten, or make the tone more professional.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toast.info('AI copywriting coming soon')}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold bg-white transition-colors"
                    style={{ borderColor: V.border, color: V.dark }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = V.bgLight }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                  >
                    More Conversational
                  </button>
                  <button
                    onClick={() => toast.info('AI copywriting coming soon')}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold bg-white transition-colors"
                    style={{ borderColor: V.border, color: V.dark }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = V.bgLight }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                  >
                    Shorten
                  </button>
                </div>
              </div>
            </div>

            {/* Placeholders sidebar */}
            <div className="w-56 shrink-0 border-l overflow-y-auto px-4 py-5 space-y-4" style={{ borderColor: V.cardBorder }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">System Placeholders</p>
                <div className="space-y-1.5">
                  {SYSTEM_PLACEHOLDERS.map(ph => (
                    <button key={ph.key}
                      onMouseDown={e => { e.preventDefault(); insertPlaceholder(ph.key) }}
                      title={`Insert ${ph.key}`}
                      className="block w-full rounded-xl border px-3 py-2 text-left transition-colors"
                      style={{ borderColor: V.cardBorder, background: V.cardBg }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = V.border; el.style.background = V.bg }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = V.cardBorder; el.style.background = V.cardBg }}
                    >
                      <p className="text-[11px] font-mono font-semibold" style={{ color: V.primary }}>{ph.key}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{ph.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom placeholders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Custom</p>
                  <button onClick={() => setShowPlaceholderForm(v => !v)}
                    className="flex size-5 items-center justify-center rounded hover:bg-muted transition-colors">
                    <Plus className="size-3 text-muted-foreground" />
                  </button>
                </div>

                {showPlaceholderForm && (
                  <div className="mb-2 space-y-1.5">
                    <input
                      autoFocus
                      value={newPlaceholderKey}
                      onChange={e => setNewPlaceholderKey(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomPlaceholder()}
                      placeholder="e.g. team_name"
                      className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs outline-none transition"
                      style={{ borderColor: V.cardBorder }}
                      onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = V.border }}
                      onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = V.cardBorder }}
                    />
                    <div className="flex gap-1">
                      <button onClick={addCustomPlaceholder}
                        className="flex-1 rounded-lg py-1.5 text-xs font-bold text-white transition-colors"
                        style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})` }}>
                        Add
                      </button>
                      <button onClick={() => { setShowPlaceholderForm(false); setNewPlaceholderKey('') }}
                        className="flex size-7 items-center justify-center rounded-lg hover:bg-muted transition-colors">
                        <X className="size-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {selected.placeholders.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground">No custom placeholders yet.</p>
                  ) : (
                    selected.placeholders.map(ph => (
                      <div key={ph.key} className="flex items-center gap-1">
                        <button onMouseDown={e => { e.preventDefault(); insertPlaceholder(ph.key) }}
                          className="flex-1 rounded-xl border px-3 py-2 text-left transition-colors"
                          style={{ borderColor: V.cardBorder, background: V.cardBg }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = V.border; el.style.background = V.bg }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = V.cardBorder; el.style.background = V.cardBg }}
                        >
                          <p className="text-[11px] font-mono font-semibold" style={{ color: V.primary }}>{ph.key}</p>
                        </button>
                        <button onClick={() => removeCustomPlaceholder(ph.key)}
                          className="flex size-6 items-center justify-center rounded hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Placeholder dropdown portal — fixed, escapes all overflow-hidden ── */}
      {showCustomPh && phDropdownPos && (
        <div
          data-ph-dropdown="true"
          className="rounded-xl overflow-hidden"
          style={{
            position: 'fixed',
            top:       phDropdownPos.top,
            left:      phDropdownPos.left,
            width:     '280px',
            maxHeight: '320px',
            overflowY: 'auto',
            zIndex:    9999,
            background: '#ffffff',
            border:     `1.5px solid ${V.border}`,
            boxShadow:  '0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.10)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-2.5 sticky top-0"
            style={{ background: V.bg, borderBottom: `1px solid ${V.border}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: V.muted }}>
              System Placeholders
            </p>
          </div>

          {/* System placeholder items */}
          {SYSTEM_PLACEHOLDERS.map(ph => (
            <button key={ph.key} type="button"
              onMouseDown={e => { e.preventDefault(); insertPlaceholder(ph.key); setShowCustomPh(false) }}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-xs text-left transition-colors"
              style={{ background: '#ffffff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = V.bg }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ffffff' }}
            >
              <span className="font-mono font-bold" style={{ color: V.primary }}>{ph.key}</span>
              <span className="shrink-0 text-[11px] font-medium" style={{ color: V.muted }}>{ph.label}</span>
            </button>
          ))}

          {/* Custom placeholders */}
          {selected.placeholders.length > 0 && (
            <>
              <div className="px-4 py-2 sticky"
                style={{ background: V.bg, borderTop: `1px solid ${V.border}`, borderBottom: `1px solid ${V.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: V.muted }}>Custom</p>
              </div>
              {selected.placeholders.map(ph => (
                <button key={ph.key} type="button"
                  onMouseDown={e => { e.preventDefault(); insertPlaceholder(ph.key); setShowCustomPh(false) }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-xs text-left transition-colors"
                  style={{ background: '#ffffff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = V.bg }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ffffff' }}
                >
                  <span className="font-mono font-bold" style={{ color: V.primary }}>{ph.key}</span>
                  <span className="shrink-0 text-[11px] font-medium" style={{ color: V.muted }}>{ph.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Preview Link Modal ── */}
      {previewLink && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPreviewLink(null)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'hsl(150,16%,87%)', background: V.bg }}>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl text-white"
                  style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})` }}>
                  <Share2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#1F2D2A' }}>Preview Link Generated</p>
                  <p className="text-[11px]" style={{ color: V.muted }}>Share this link to preview "{selected.name}"</p>
                </div>
              </div>
              <button onClick={() => setPreviewLink(null)}
                className="flex size-7 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                style={{ color: V.muted }}>
                <X className="size-4" />
              </button>
            </div>

            {/* URL box */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2 rounded-xl border px-3 py-3"
                style={{ borderColor: V.border, background: 'hsl(152,14%,96%)' }}>
                <ExternalLink className="size-3.5 shrink-0" style={{ color: V.primary }} />
                <p className="text-xs font-mono truncate flex-1" style={{ color: V.dark }}>
                  {previewLink}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={copyLink}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all"
                  style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})`, boxShadow: '4px 4px 10px rgba(64,130,109,0.25)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}>
                  {linkCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all"
                  style={{ borderColor: V.border, color: V.dark, background: V.bg }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = V.border }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = V.bg }}>
                  <ExternalLink className="size-4" /> Open
                </a>
              </div>

              <p className="text-center text-[11px]" style={{ color: '#9BB5AD' }}>
                Anyone with this link can view the template preview — no login required.
              </p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}


// ── Toolbar button ─────────────────────────────────────────────

function ToolbarBtn({ icon: Icon, title, onMouseDown }: {
  icon: React.ElementType; title: string; onMouseDown: () => void
}) {
  return (
    <button type="button" title={title}
      onMouseDown={e => { e.preventDefault(); onMouseDown() }}
      className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
      <Icon className="size-3.5" />
    </button>
  )
}
