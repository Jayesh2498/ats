/**
 * Public Job Application page — with resume upload + AI scoring
 * Route: /apply/:slug
 * No auth required — candidates apply here
 */
import { useState, useRef, FormEvent, DragEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin, Briefcase, CheckCircle, AlertCircle,
  Loader2, ArrowLeft, Upload, X, FileText, Brain, Clock,
  Building2, Users,
} from 'lucide-react'
import { useJobBySlug, useApply } from '@/hooks/useJobLifecycle'
import { AtsIcon } from '@/components/AtsIcon'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship',
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const ACCEPTED_EXT = '.pdf,.doc,.docx,.txt'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Design tokens ─────────────────────────────────────────────
const V = {
  primary: '#40826D',
  dark:    '#2F6F5E',
  light:   '#5A9C87',
  bg50:    '#EEF6F3',
  bg100:   '#D6EDE7',
  border:  '#B0D9CF',
  muted:   '#6B7C77',
  text:    '#1F2D2A',
}

export default function ApplyPage() {
  const { slug } = useParams<{ slug: string }>()
  const { job, loading, notFound } = useJobBySlug(slug)
  const { apply, submitting, submitStage, error } = useApply()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [dragOver, setDragOver]     = useState(false)
  const [fileError, setFileError]   = useState<string | null>(null)
  const [submitted, setSubmitted]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function validateAndSet(file: File) {
    setFileError(null)
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      setFileError('Only PDF, Word (.doc/.docx), or plain text files are accepted.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File must be under 10 MB.')
      return
    }
    setResumeFile(file)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSet(file)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!job) return
    const result = await apply({
      job_id: job.id,
      full_name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      linkedin_url: linkedin.trim() || undefined,
      resume_file: resumeFile ?? undefined,
    })
    if (result.success) setSubmitted(true)
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: `linear-gradient(160deg, ${V.bg50} 0%, #fff 55%, ${V.bg50} 100%)` }}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: `linear-gradient(135deg, ${V.primary}, ${V.dark})` }}>
            <Briefcase className="size-5 text-white" />
          </div>
          <Loader2 className="size-5 animate-spin" style={{ color: V.primary }} />
        </div>
      </div>
    )
  }

  // ── Not found ─────────────────────────────────────────────────
  if (notFound || !job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
        style={{ background: `linear-gradient(160deg, ${V.bg50} 0%, #fff 55%, ${V.bg50} 100%)` }}>
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl" style={{ background: V.bg100 }}>
          <Briefcase className="size-7" style={{ color: V.muted }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: V.text }}>Job not found</h1>
        <p className="text-sm mb-6" style={{ color: V.muted }}>This position may have been closed or the link is invalid.</p>
        <Link to="/" className="text-sm font-semibold flex items-center gap-1 hover:underline" style={{ color: V.primary }}>
          <ArrowLeft className="size-3.5" /> Go back
        </Link>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
        style={{ background: `linear-gradient(160deg, ${V.bg50} 0%, #fff 55%, ${V.bg50} 100%)` }}>
        <div className="mb-6 flex size-20 items-center justify-center rounded-full shadow-md"
          style={{ background: V.bg50, border: `2px solid ${V.border}` }}>
          <CheckCircle className="size-10" style={{ color: V.primary }} />
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ color: V.text }}>Application submitted!</h1>
        <p className="text-base mb-1" style={{ color: V.text }}>Thanks, <strong>{name}</strong>.</p>
        <p className="text-sm max-w-sm mb-5" style={{ color: V.muted }}>
          We've received your application for <strong style={{ color: V.text }}>{job.title}</strong>. Our team will be in touch soon.
        </p>
        {resumeFile && (
          <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
            style={{ background: V.bg50, borderColor: V.border, color: V.primary }}>
            <Brain className="size-4 shrink-0" />
            Your resume was analysed by AI and scored automatically.
          </div>
        )}
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(160deg, ${V.bg50} 0%, #fff 55%, ${V.bg50} 100%)` }}>

      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center gap-3" style={{ background: '#fff', borderColor: V.border }}>
        <div className="flex size-8 items-center justify-center rounded-xl shadow-sm"
          style={{ background: `linear-gradient(135deg, ${V.primary}, ${V.dark})` }}>
          <AtsIcon size={16} color="white" />
        </div>
        <span className="text-sm font-extrabold" style={{ color: V.text }}>ATS</span>
        <div className="ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold"
          style={{ borderColor: V.border, background: V.bg50, color: V.muted }}>
          <div className="size-1.5 rounded-full animate-pulse" style={{ background: V.primary }} />
          Now Hiring
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-5 py-10">

        {/* Job hero card */}
        <div className="mb-6 rounded-3xl overflow-hidden border shadow-sm" style={{ borderColor: V.border }}>
          {/* Gradient header */}
          <div className="px-8 pt-8 pb-6" style={{ background: `linear-gradient(135deg, ${V.primary} 0%, ${V.dark} 100%)` }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Open Position
            </p>
            <h1 className="text-3xl font-black text-white leading-tight mb-3">{job.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {job.department && (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.95)' }}>
                  <Building2 className="size-3" />{job.department}
                </span>
              )}
              {job.location && (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
                  <MapPin className="size-3" />{job.location}
                </span>
              )}
              {job.employment_type && (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
                  <Clock className="size-3" />{EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type}
                </span>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 divide-x" style={{ borderTop: `1px solid ${V.border}`, background: '#fff', divideColor: V.border } as React.CSSProperties}>
            {[
              { icon: <Briefcase className="size-3.5" />, label: 'Role Type', value: EMPLOYMENT_LABELS[job.employment_type ?? ''] ?? 'Full-time' },
              { icon: <MapPin className="size-3.5" />,    label: 'Location',  value: job.location ?? 'Remote' },
              { icon: <Users className="size-3.5" />,     label: 'Department', value: job.department ?? 'General' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex flex-col items-center py-4 px-3 gap-0.5" style={{ borderColor: V.border }}>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: V.muted }}>
                  <span style={{ color: V.primary }}>{icon}</span>{label}
                </div>
                <p className="text-xs font-bold text-center" style={{ color: V.text }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: V.border }}>
            <h2 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: V.muted }}>About this role</h2>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: V.text }}>
              {job.description}
            </div>
          </div>
        )}

        {/* Application form card */}
        <div className="rounded-3xl border bg-white overflow-hidden shadow-sm" style={{ borderColor: V.border }}>
          {/* Form header */}
          <div className="px-8 py-5 border-b" style={{ borderColor: V.border, background: V.bg50 }}>
            <h2 className="text-lg font-black" style={{ color: V.text }}>Apply Now</h2>
            <p className="text-xs mt-0.5" style={{ color: V.muted }}>Fill in your details below. Takes about 2 minutes.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required className="h-11" />
              </Field>
              <Field label="Email" required>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required className="h-11" />
              </Field>
            </div>

            {/* Phone + LinkedIn */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="h-11" />
              </Field>
              <Field label="LinkedIn URL">
                <Input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="h-11" />
              </Field>
            </div>

            {/* Resume Upload */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: V.muted }}>Resume / CV</label>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ background: V.bg100, color: V.primary }}>
                  <Brain className="size-2.5" /> AI Scored
                </span>
              </div>

              {resumeFile ? (
                <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
                  style={{ borderColor: V.border, background: V.bg50 }}>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: V.bg100 }}>
                    <FileText className="size-4" style={{ color: V.primary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: V.text }}>{resumeFile.name}</p>
                    <p className="text-xs" style={{ color: V.muted }}>{formatBytes(resumeFile.size)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                      style={{ background: V.bg100, color: V.primary }}>
                      <Brain className="size-2.5" /> AI Ready
                    </div>
                    <button
                      type="button"
                      onClick={() => { setResumeFile(null); setFileError(null) }}
                      className="flex size-6 items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                      style={{ color: V.muted }}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all',
                  )}
                  style={{
                    borderColor: dragOver ? V.primary : V.border,
                    background: dragOver ? V.bg50 : '#fafafa',
                  }}
                >
                  <div className="flex size-11 items-center justify-center rounded-xl transition-colors"
                    style={{ background: dragOver ? V.bg100 : '#f3f4f6' }}>
                    <Upload className="size-5" style={{ color: dragOver ? V.primary : '#9CA3AF' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: V.text }}>
                      {dragOver ? 'Drop your resume here' : 'Upload your resume'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: V.muted }}>PDF, Word, or TXT · Max 10 MB · Drag & drop or click</p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
                    style={{ background: V.bg50, borderColor: V.border, color: V.primary }}>
                    <Brain className="size-3 shrink-0" />
                    Your resume will be automatically scored by AI
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept={ACCEPTED_EXT} className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSet(f); e.target.value = '' }} />

              {fileError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="size-3.5" /> {fileError}
                </p>
              )}
            </div>

            {/* Submit error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3">
                <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !name || !email}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${V.primary}, ${V.dark})`,
                boxShadow: `0 4px 14px rgba(64,130,109,0.28)`,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {submitStage || 'Submitting…'}
                </>
              ) : (
                'Submit Application'
              )}
            </button>

            <p className="text-center text-xs" style={{ color: V.muted }}>
              By applying you agree to our privacy policy. Your data is handled securely.
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs" style={{ color: V.muted }}>
          Powered by <strong style={{ color: V.primary }}>ATS</strong>
        </p>
      </div>
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7C77' }}>
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
