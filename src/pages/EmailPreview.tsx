/**
 * EmailPreview — public shareable email template preview
 * Route: /email-preview/:token  (no auth required)
 */
import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Mail, ArrowLeft, AlertTriangle } from 'lucide-react'

interface PreviewPayload {
  name:    string
  subject: string
  body:    string
  badge?:  string
}

const V = {
  primary: '#40826D',
  dark:    '#2F6F5E',
  bg:      '#EEF6F3',
  border:  '#B0D9CF',
  muted:   '#6B7C77',
}

/** Replace {{placeholder}} with styled spans */
function renderBody(text: string): React.ReactNode[] {
  const parts = text.split(/(\{\{[^}]+\}\})/g)
  return parts.map((part, i) => {
    if (/^\{\{[^}]+\}\}$/.test(part)) {
      return (
        <span key={i} className="inline-block rounded px-1 py-px text-xs font-mono font-bold"
          style={{ background: '#D6EDE7', color: V.dark }}>
          {part}
        </span>
      )
    }
    // Render newlines as <br>
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ))
  })
}

export default function EmailPreview() {
  const { token } = useParams<{ token: string }>()

  const payload = useMemo<PreviewPayload | null>(() => {
    if (!token) return null
    try {
      return JSON.parse(decodeURIComponent(atob(token))) as PreviewPayload
    } catch {
      return null
    }
  }, [token])

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8"
        style={{ background: 'hsl(152,14%,97%)' }}>
        <div className="text-center space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl mx-auto"
            style={{ background: 'hsl(0,86%,95%)' }}>
            <AlertTriangle className="size-7 text-red-500" />
          </div>
          <h1 className="text-xl font-black" style={{ color: '#1F2D2A' }}>Invalid Preview Link</h1>
          <p className="text-sm" style={{ color: V.muted }}>This link may be expired or malformed.</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})` }}>
            <ArrowLeft className="size-4" /> Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'hsl(152,14%,97%)' }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})` }}>
              <Mail className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: V.primary }}>Email Template Preview</p>
              <h1 className="text-lg font-black" style={{ color: '#1F2D2A' }}>{payload.name}</h1>
            </div>
          </div>
          {payload.badge && (
            <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
              style={{ background: V.bg, color: V.dark, border: `1px solid ${V.border}` }}>
              {payload.badge}
            </span>
          )}
        </div>

        {/* Email card */}
        <div className="rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: `1px solid ${V.border}` }}>

          {/* Email client chrome */}
          <div className="px-6 py-4 border-b" style={{ background: V.bg, borderColor: V.border }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-2.5 rounded-full bg-red-400" />
              <div className="size-2.5 rounded-full bg-amber-400" />
              <div className="size-2.5 rounded-full bg-green-400" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider w-14 shrink-0" style={{ color: V.muted }}>From</span>
                <span className="text-sm" style={{ color: '#1F2D2A' }}>
                  <span className="font-semibold">{'{{recruiter_name}}'}</span>
                  {' '}
                  <span style={{ color: V.muted }}>{'<recruiter@company.com>'}</span>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider w-14 shrink-0" style={{ color: V.muted }}>To</span>
                <span className="text-sm font-semibold" style={{ color: '#1F2D2A' }}>{'{{candidate_name}}'}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider w-14 shrink-0" style={{ color: V.muted }}>Subject</span>
                <span className="text-sm font-bold" style={{ color: '#1F2D2A' }}>{payload.subject}</span>
              </div>
            </div>
          </div>

          {/* Email body */}
          <div className="px-8 py-7 bg-white">
            <div className="text-sm leading-relaxed" style={{ color: '#374151' }}>
              {renderBody(payload.body)}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-xl border px-4 py-3 flex items-start gap-3"
          style={{ borderColor: V.border, background: V.bg }}>
          <div className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ background: V.primary }} />
          <p className="text-xs leading-relaxed" style={{ color: V.muted }}>
            Highlighted tokens like{' '}
            <span className="inline-block rounded px-1 py-px font-mono font-bold text-[11px]"
              style={{ background: '#D6EDE7', color: V.dark }}>
              {'{{candidate_name}}'}
            </span>{' '}
            will be replaced with real values when the email is sent.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px]" style={{ color: '#9BB5AD' }}>
          Generated by ATS · Read-only preview
        </p>
      </div>
    </div>
  )
}
