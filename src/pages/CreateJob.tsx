/**
 * Create / Edit Job — full-page layout, viridian theme
 * Route: /jobs/new  |  /jobs/:id/edit
 */
import { useState, useEffect, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Sparkles, X, Lightbulb, Loader2, Plus, Trash2, Eye } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Input } from '@/components/ui/input'
import { useJobs } from '@/hooks/useJobLifecycle'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

// ── Design tokens ──────────────────────────────────────────────
const V = {
  primary:   '#40826D',
  dark:      '#2F6F5E',
  border:    '#B0D9CF',
  bg:        '#EEF6F3',
  cardBg:    'hsl(152,14%,96%)',
  cardBorder:'hsl(150,16%,87%)',
  muted:     '#6B7C77',
}
const BTN_PRIMARY = {
  background: `linear-gradient(135deg,${V.primary},${V.dark})`,
  color: '#fff', borderRadius: '12px',
  boxShadow: '4px 4px 10px rgba(64,130,109,0.25),-3px -3px 8px rgba(255,255,255,0.55)',
  border: 'none', cursor: 'pointer', transition: 'all 150ms ease',
} as React.CSSProperties
const BTN_GHOST = {
  background: V.cardBg, color: V.muted, borderRadius: '12px',
  border: `1px solid ${V.cardBorder}`,
  boxShadow: '3px 3px 8px rgba(0,0,0,0.05),-2px -2px 6px rgba(255,255,255,0.65)',
  cursor: 'pointer', transition: 'all 150ms ease',
} as React.CSSProperties

const DEPARTMENTS      = ['Engineering','Design','Product','Marketing','Sales','Operations','Finance','HR']
const EXPERIENCE_LEVELS = ['Entry Level','Mid Level','Senior Level','Lead / Principal','Director+']
const EMPLOYMENT_TYPES  = [{ label:'Full-time', value:'full_time' }, { label:'Contract', value:'contract' }, { label:'Part-time', value:'part_time' }]
const SUGGESTED_FIELDS  = ['Salary Range','Equity','Remote / On-site','Timezone','Start Date','Reporting To','Team Size','Interview Process']

interface CustomField { id: string; label: string; value: string }

function generateAiDescription(title: string, department: string, expLevel: string): string {
  const expYears: Record<string,string> = {
    'Entry Level':'0–2 years','Mid Level':'3–5 years',
    'Senior Level':'5–8 years','Lead / Principal':'8+ years','Director+':'10+ years',
  }
  const years = expYears[expLevel] ?? '3+ years'
  const deptCtx: Record<string,{skills:string;responsibilities:string}> = {
    Engineering:  { skills:'proficiency in modern programming languages (TypeScript, Python, Go), cloud infrastructure, and system design fundamentals', responsibilities:'Design and implement scalable systems\n- Lead architecture reviews and code quality\n- Partner with Product and Design end-to-end\n- Mentor teammates' },
    Design:       { skills:'a strong portfolio, proficiency in Figma, and experience with user research', responsibilities:'Own end-to-end design for key product areas\n- Conduct user research\n- Develop and maintain the design system\n- Partner with engineering for pixel-perfect implementation' },
    Product:      { skills:'strong analytical skills, data-driven decision making, and ability to thrive in ambiguity', responsibilities:'Define product vision, strategy, and roadmap\n- Work with engineering, design, and data\n- Drive product launches\n- Synthesise customer feedback' },
    Marketing:    { skills:'growth marketing, content strategy, data analytics, and campaign management', responsibilities:'Plan and execute multi-channel campaigns\n- Analyse performance and optimise for growth\n- Collaborate on go-to-market strategies\n- Build brand awareness' },
    Sales:        { skills:'proven B2B sales track record, excellent communication, and CRM experience', responsibilities:'Own the full sales cycle from prospecting to close\n- Build and maintain enterprise client relationships\n- Hit and exceed quarterly targets' },
    Operations:   { skills:'process optimisation, data analysis, and project management', responsibilities:'Streamline internal operations\n- Identify bottlenecks and implement solutions\n- Build reporting frameworks for key metrics' },
    Finance:      { skills:'financial modelling, FP&A, and accounting principles', responsibilities:'Manage financial planning and reporting\n- Support strategic decisions with data\n- Partner with leadership on budgeting' },
    HR:           { skills:'talent acquisition, people operations, and HRIS tools', responsibilities:'Lead full-cycle recruiting and onboarding\n- Build employee development programs\n- Maintain compliance with employment policies' },
  }
  const ctx = deptCtx[department] ?? deptCtx.Engineering
  return `We are hiring a ${title} to join our ${department} team. This is a ${expLevel} role (${years}) for someone passionate about making an impact.\n\n## Responsibilities\n\n- ${ctx.responsibilities}\n\n## Requirements\n\n- ${years} of relevant experience\n- ${ctx.skills}\n- Strong communication skills\n\n## Nice to Have\n\n- Experience at a high-growth AI company\n\n## What We Offer\n\n- Competitive salary and equity\n- Remote-friendly with flexible hours\n- Health, dental, and vision coverage\n`
}

// ── Preview Modal ──────────────────────────────────────────────
function PreviewModal({ title, dept, location, empType, expLevel, description, openPositions, customFields, onClose }: {
  title: string; dept: string; location: string; empType: string; expLevel: string
  description: string; openPositions: number; customFields: CustomField[]; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{ background: '#fff', boxShadow: '16px 16px 40px rgba(0,0,0,0.15),-8px -8px 20px rgba(255,255,255,0.5)' }}>
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{ background: '#fff' }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: V.primary }}>Job Preview</span>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase" style={{ background: V.bg, color: V.dark }}>Draft</span>
              {dept && <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase" style={{ background: 'hsl(150,14%,89%)', color: V.muted }}>{dept}</span>}
            </div>
            <h1 className="text-2xl font-black" style={{ color: '#1F2D2A' }}>{title || 'Job Title'}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-sm" style={{ color: V.muted }}>
              {location && <span>📍 {location}</span>}
              {empType && <span>⏱ {EMPLOYMENT_TYPES.find(t => t.value === empType)?.label ?? empType}</span>}
              {expLevel && <span>🎯 {expLevel}</span>}
              {openPositions > 1 && <span>👥 {openPositions} openings</span>}
            </div>
          </div>
          {customFields.filter(f => f.label).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {customFields.filter(f => f.label).map(f => (
                <div key={f.id} className="rounded-xl p-3" style={{ background: V.cardBg, border: `1px solid ${V.cardBorder}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: V.muted }}>{f.label}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: '#1F2D2A' }}>{f.value || '—'}</p>
                </div>
              ))}
            </div>
          )}
          {description && (
            <div className="prose prose-sm max-w-none" style={{ color: '#1F2D2A' }}>
              {description.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h3 key={i} className="text-base font-bold mt-4 mb-1" style={{ color: '#1F2D2A' }}>{line.replace('## ','')}</h3>
                if (line.startsWith('- ')) return <p key={i} className="text-sm" style={{ color: '#6B7C77', marginLeft: '12px' }}>• {line.slice(2)}</p>
                return line ? <p key={i} className="text-sm leading-relaxed" style={{ color: '#6B7C77' }}>{line}</p> : <div key={i} className="h-1" />
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function CreateJob() {
  const navigate  = useNavigate()
  const { id: editId } = useParams<{ id?: string }>()
  const { createJob, publishJob, jobs, updateJob } = useJobs()
  const { user }  = useAuth()
  const isEditing = !!editId

  const [title, setTitle]                   = useState('')
  const [dept, setDept]                     = useState('Engineering')
  const [location, setLocation]             = useState('')
  const [employmentType, setEmploymentType] = useState('full_time')
  const [expLevel, setExpLevel]             = useState('Mid Level')
  const [description, setDescription]       = useState('')
  const [openPositions, setOpenPositions]   = useState(1)
  const [customFields, setCustomFields]     = useState<CustomField[]>([])
  const [showFieldSuggestions, setShowFieldSuggestions] = useState(false)
  const [isGenerating, setIsGenerating]     = useState(false)
  const [isSaving, setIsSaving]             = useState(false)
  const [isPublishing, setIsPublishing]     = useState(false)
  const [showPreview, setShowPreview]       = useState(false)

  // Pre-fill when editing
  useEffect(() => {
    if (!editId || !jobs.length) return
    const job = jobs.find(j => j.id === editId)
    if (!job) return
    setTitle(job.title)
    setDept(job.department ?? 'Engineering')
    setLocation(job.location ?? '')
    setEmploymentType(job.employment_type ?? 'full_time')
    setExpLevel(job.experience_level ?? 'Mid Level')
    setDescription(job.description ?? '')
    setOpenPositions(job.open_positions ?? 1)
    if (job.extra_fields) {
      setCustomFields(Object.entries(job.extra_fields).map(([label, value]) => ({
        id: crypto.randomUUID(), label, value: String(value),
      })))
    }
  }, [editId, jobs])

  async function handleAiAssist() {
    if (!title.trim()) { toast.error('Add a job title first'); return }
    setIsGenerating(true)
    await new Promise(r => setTimeout(r, 1100))
    setDescription(generateAiDescription(title, dept, expLevel))
    setIsGenerating(false)
    toast.success('AI draft ready')
  }

  function addCustomField(label = '') {
    setCustomFields(p => [...p, { id: crypto.randomUUID(), label, value: '' }])
    setShowFieldSuggestions(false)
  }
  function updateField(id: string, key: 'label'|'value', val: string) {
    setCustomFields(p => p.map(f => f.id === id ? {...f,[key]:val} : f))
  }
  function removeField(id: string) { setCustomFields(p => p.filter(f => f.id !== id)) }
  function buildExtraData() {
    if (!customFields.length) return undefined
    return Object.fromEntries(customFields.filter(f => f.label).map(f => [f.label, f.value]))
  }

  const jobInput = () => ({
    title, department: dept, location, employment_type: employmentType,
    experience_level: expLevel, description,
    workspace_id: user?.org_id ?? user?.id ?? 'default',
    open_positions: openPositions, extra_fields: buildExtraData(),
  })

  async function handleSaveDraft() {
    if (!title.trim()) return
    setIsSaving(true)
    if (isEditing && editId) {
      await updateJob?.(editId, jobInput())
      toast.success('Job updated')
      navigate('/jobs')
    } else {
      const job = await createJob(jobInput())
      if (job) { toast.success('Draft saved'); navigate('/jobs') }
      else toast.error('Failed to save draft')
    }
    setIsSaving(false)
  }

  async function handlePublish(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setIsPublishing(true)
    if (isEditing && editId) {
      await updateJob?.(editId, jobInput())
      toast.success('Job updated and published')
      navigate('/jobs')
    } else {
      const job = await createJob(jobInput())
      if (!job) { toast.error('Failed to create job'); setIsPublishing(false); return }
      await publishJob(job.id)
      toast.success(`"${title}" is now live!`)
      navigate('/jobs')
    }
    setIsPublishing(false)
  }

  const fieldStyle = {
    height: '44px', borderRadius: '10px', border: `1px solid ${V.cardBorder}`,
    background: V.cardBg, padding: '0 12px', fontSize: '14px', color: '#1F2D2A',
    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.05),inset -2px -2px 5px rgba(255,255,255,0.6)',
    width: '100%', outline: 'none',
  } as React.CSSProperties

  return (
    <AppShell>
      <div className="h-full flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-8 py-4 border-b shrink-0"
          style={{ borderColor: 'hsl(150,16%,87%)', background: 'hsl(152,14%,97%)' }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/jobs" className="hover:text-foreground transition-colors font-medium">Jobs</Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground font-semibold">{isEditing ? 'Edit Job' : 'Create New Job'}</span>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/jobs')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <X className="size-4" /> Discard
            </button>
            <button type="button" onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all"
              style={BTN_GHOST}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = V.primary }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = V.muted }}>
              <Eye className="size-3.5" /> Preview
            </button>
            <button type="button" onClick={handleSaveDraft} disabled={!title.trim() || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50"
              style={BTN_GHOST}>
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Save Draft'}
            </button>
            <button form="create-job-form" type="submit" disabled={!title.trim() || isPublishing}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold transition-all disabled:opacity-50"
              style={BTN_PRIMARY}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '6px 6px 14px rgba(64,130,109,0.30),-3px -3px 8px rgba(255,255,255,0.5)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '4px 4px 10px rgba(64,130,109,0.25),-3px -3px 8px rgba(255,255,255,0.55)' }}>
              {isPublishing && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? 'Update & Publish' : 'Publish Job'}
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          <form id="create-job-form" onSubmit={handlePublish}>
            <div className="flex items-start min-h-full">

              {/* ── Left: Main form ── */}
              <div className="flex-1 px-10 py-8 space-y-7 min-w-0 border-r" style={{ borderColor: 'hsl(150,16%,88%)' }}>
                <div>
                  <h1 className="text-3xl font-black text-foreground">
                    {isEditing ? 'Edit Job' : 'Draft Your Next Role'}
                  </h1>
                  <p className="text-muted-foreground mt-1.5 text-sm">
                    Use AI Assist to generate a personalised description.
                  </p>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Job Title *</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Senior Product Designer" className="h-12 text-base" required />
                </div>

                {/* Dept + Location */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Department</label>
                    <select value={dept} onChange={e => setDept(e.target.value)} style={fieldStyle}>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Location</label>
                    <Input value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="Remote, New York, London…" className="h-11" />
                  </div>
                </div>

                {/* Employment + Experience + Open Positions */}
                <div className="grid grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Employment</label>
                    <div className="flex gap-2 flex-wrap">
                      {EMPLOYMENT_TYPES.map(t => (
                        <button type="button" key={t.value} onClick={() => setEmploymentType(t.value)}
                          className="rounded-[10px] border px-3 py-2 text-xs font-semibold transition-all"
                          style={employmentType === t.value ? {
                            background: `linear-gradient(135deg,${V.primary},${V.dark})`,
                            borderColor: V.dark, color: '#fff',
                            boxShadow: '3px 3px 8px rgba(64,130,109,0.25),-2px -2px 5px rgba(255,255,255,0.4)',
                          } : { background: V.cardBg, borderColor: V.cardBorder, color: V.muted }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Experience Level</label>
                    <select value={expLevel} onChange={e => setExpLevel(e.target.value)} style={fieldStyle}>
                      {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Open Positions</label>
                    <input type="number" min={1} max={99} value={openPositions}
                      onChange={e => setOpenPositions(Math.max(1, parseInt(e.target.value)||1))}
                      style={fieldStyle} />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Job Description</label>
                    <button type="button" onClick={handleAiAssist} disabled={isGenerating}
                      className="flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70 transition-all"
                      style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})`, boxShadow: '3px 3px 8px rgba(64,130,109,0.25),-2px -2px 6px rgba(255,255,255,0.5)' }}>
                      {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                      {isGenerating ? 'Generating…' : 'AI Assist'}
                    </button>
                  </div>
                  <div className="rounded-xl border overflow-hidden relative"
                    style={{ borderColor: V.cardBorder, background: V.cardBg, boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.05),inset -2px -2px 6px rgba(255,255,255,0.6)' }}>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={16}
                      placeholder="Start typing or click AI Assist to generate a tailored description…"
                      className="w-full resize-none bg-transparent px-4 py-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none font-mono" />
                    {isGenerating && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                        style={{ background: 'rgba(238,246,243,0.85)' }}>
                        <div className="flex flex-col items-center gap-2">
                          <Sparkles className="size-7 animate-pulse" style={{ color: V.primary }} />
                          <p className="text-sm text-muted-foreground">Crafting a description for <strong>{title}</strong>…</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom fields */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Additional Details</label>
                    <div className="relative">
                      <button type="button" onClick={() => setShowFieldSuggestions(v => !v)}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold transition-colors"
                        style={{ borderColor: V.border, color: V.primary }}>
                        <Plus className="size-3" /> Add Field
                      </button>
                      {showFieldSuggestions && (
                        <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl border bg-popover shadow-lg overflow-hidden">
                          <div className="px-3 py-2 border-b">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Suggested</p>
                          </div>
                          {SUGGESTED_FIELDS.map(f => (
                            <button key={f} type="button" onClick={() => addCustomField(f)}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left">
                              <Plus className="size-3 text-muted-foreground shrink-0" /> {f}
                            </button>
                          ))}
                          <div className="border-t">
                            <button type="button" onClick={() => addCustomField('')}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold hover:bg-muted transition-colors text-left"
                              style={{ color: V.primary }}>
                              <Plus className="size-3" /> Custom field…
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {customFields.map(field => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input value={field.label} onChange={e => updateField(field.id,'label',e.target.value)}
                        placeholder="Field name" className="h-10 w-40 text-sm shrink-0" />
                      <Input value={field.value} onChange={e => updateField(field.id,'value',e.target.value)}
                        placeholder="Value" className="h-10 flex-1 text-sm" />
                      <button type="button" onClick={() => removeField(field.id)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {!customFields.length && (
                    <p className="text-xs text-muted-foreground">Add salary range, equity, remote policy, and more.</p>
                  )}
                </div>

                {/* Bottom spacer */}
                <div className="h-8" />
              </div>

              {/* ── Right: Sticky sidebar ── */}
              <div className="w-72 shrink-0 px-6 py-8 space-y-4 sticky top-0 self-start">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tips & Guidance</p>

                <div className="rounded-2xl border p-4 space-y-2" style={{ borderColor: V.border, background: V.bg }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: V.primary }}>Pro Tip</p>
                  <p className="text-sm leading-relaxed" style={{ color: V.dark }}>
                    Roles with specific growth outcomes see <strong>40% higher quality</strong> applicants.
                  </p>
                </div>

                <div className="rounded-2xl border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2" style={{ color: '#D97706' }}>
                    <Lightbulb className="size-4" />
                    <p className="text-xs font-semibold">Quick Tip</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add a <strong>Salary Range</strong> to get <strong>3× more applicants</strong>.
                  </p>
                </div>

                <div className="rounded-2xl border bg-card p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Open Positions</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set how many hires you need. This shows on job cards and tracks pending headcount on the dashboard.
                  </p>
                </div>

                <div className="rounded-2xl border bg-card p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Assist</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Fill in the title, department, and experience level first — then click <strong>AI Assist</strong> for a tailored draft.
                  </p>
                </div>

                {/* Status indicator */}
                {title && (
                  <div className="rounded-xl p-3 space-y-1.5" style={{ background: V.bg, border: `1px solid ${V.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: V.primary }}>Current Draft</p>
                    <p className="text-sm font-bold" style={{ color: '#1F2D2A' }}>{title}</p>
                    {dept && <p className="text-xs" style={{ color: V.muted }}>{dept} · {expLevel}</p>}
                    {openPositions > 1 && (
                      <p className="text-xs font-semibold" style={{ color: V.primary }}>{openPositions} open positions</p>
                    )}
                    {description && (
                      <p className="text-[11px]" style={{ color: V.muted }}>
                        {description.length} chars
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          title={title} dept={dept} location={location}
          empType={employmentType} expLevel={expLevel}
          description={description} openPositions={openPositions}
          customFields={customFields} onClose={() => setShowPreview(false)}
        />
      )}
    </AppShell>
  )
}
