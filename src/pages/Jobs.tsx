/**
 * Jobs page — Viridian + Claymorphism
 * Route: /jobs
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Globe, Archive, Copy, Check, Loader2, GitBranch, Pencil, Users } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { useJobs } from '@/hooks/useJobLifecycle'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/clipboard'
import type { DbJob } from '@/hooks/useJobLifecycle'

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
const CLAY = {
  card:      '6px 6px 14px rgba(0,0,0,0.07),-4px -4px 10px rgba(255,255,255,0.70)',
  cardHover: '10px 10px 20px rgba(0,0,0,0.09),-6px -6px 14px rgba(255,255,255,0.80)',
  btn:       '4px 4px 10px rgba(0,0,0,0.10),-3px -3px 8px rgba(255,255,255,0.60)',
  inset:     'inset 2px 2px 6px rgba(0,0,0,0.06),inset -2px -2px 6px rgba(255,255,255,0.65)',
}

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Draft',     bg: 'hsl(150,10%,90%)', text: V.muted  },
  published: { label: 'Published', bg: V.bgLight,           text: V.dark   },
  open:      { label: 'Open',      bg: V.bgLight,           text: V.dark   },
  closed:    { label: 'Closed',    bg: '#FEE2E2',           text: '#991B1B' },
}

// ── Primary clay button ────────────────────────────────────────
function PrimaryBtn({ children, onClick, to, disabled, className = '' }: {
  children: React.ReactNode; onClick?: () => void; to?: string; disabled?: boolean; className?: string
}) {
  const shared = {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    borderRadius: '14px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, color: '#fff',
    background: `linear-gradient(135deg,${V.primary},${V.dark})`,
    boxShadow: CLAY.btn, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition: 'all 150ms ease', textDecoration: 'none',
  } as React.CSSProperties
  const hoverIn  = (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '6px 6px 14px rgba(64,130,109,0.25),-3px -3px 8px rgba(255,255,255,0.55)' }
  const hoverOut = (e: React.MouseEvent) => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = CLAY.btn }
  if (to) return <Link to={to} style={shared} className={className} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{children}</Link>
  return <button style={shared} className={className} onClick={onClick} disabled={disabled} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>{children}</button>
}

// ── Ghost clay button ──────────────────────────────────────────
function GhostBtn({ children, onClick, disabled, danger = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      borderRadius: '10px', padding: '6px 12px', fontSize: '12px', fontWeight: 600,
      color: danger ? '#991B1B' : V.muted, background: V.cardBg,
      border: `1px solid ${danger ? '#FECACA' : V.cardBorder}`,
      boxShadow: '3px 3px 8px rgba(0,0,0,0.05),-2px -2px 6px rgba(255,255,255,0.65)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 150ms ease',
    }}
      onMouseEnter={e => { if (disabled) return; const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-1px)'; el.style.color = danger ? '#7F1D1D' : V.primary; el.style.borderColor = danger ? '#FCA5A5' : V.border; el.style.background = danger ? '#FEF2F2' : V.bg }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.color = danger ? '#991B1B' : V.muted; el.style.borderColor = danger ? '#FECACA' : V.cardBorder; el.style.background = V.cardBg }}
      onMouseDown={e => { (e.currentTarget as HTMLElement).style.boxShadow = CLAY.inset }}
      onMouseUp={e => { (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 8px rgba(0,0,0,0.05),-2px -2px 6px rgba(255,255,255,0.65)' }}
    >{children}</button>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function Jobs() {
  const { jobs, loading, publishJob, closeJob } = useJobs()
  const navigate = useNavigate()
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [copiedId, setCopiedId]       = useState<string | null>(null)
  const [deptFilter, setDeptFilter]   = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const depts = ['All', ...Array.from(new Set(jobs.map(j => j.department).filter(Boolean) as string[]))]
  const filtered = jobs.filter(j => {
    const matchDept   = deptFilter === 'All' || j.department === deptFilter
    const matchStatus = statusFilter === 'All' || j.status === statusFilter || (statusFilter === 'published' && j.status === 'open')
    return matchDept && matchStatus
  })

  async function handlePublish(job: DbJob) {
    setActioningId(job.id)
    await publishJob(job.id)
    toast.success(`"${job.title}" is now live`)
    setActioningId(null)
  }

  async function handleClose(job: DbJob) {
    setActioningId(job.id)
    await closeJob(job.id)
    toast.success(`"${job.title}" closed`)
    setActioningId(null)
  }

  async function handleCopyLink(job: DbJob) {
    if (!job.public_slug) return
    await copyToClipboard(`${window.location.origin}/apply/${job.public_slug}`)
    setCopiedId(job.id)
    toast.success('Link copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const pillStyle = (active: boolean, danger = false) => ({
    borderRadius: '9999px', padding: '6px 16px', fontSize: '13px', fontWeight: active ? 700 : 600,
    background: active ? (danger ? '#EF4444' : `linear-gradient(135deg,${V.primary},${V.dark})`) : V.cardBg,
    color: active ? '#fff' : V.muted,
    border: active ? 'none' : `1px solid ${V.cardBorder}`,
    boxShadow: active ? '3px 3px 8px rgba(0,0,0,0.12),-2px -2px 5px rgba(255,255,255,0.4)' : '3px 3px 8px rgba(0,0,0,0.05),-2px -2px 6px rgba(255,255,255,0.65)',
    cursor: 'pointer', transition: 'all 150ms ease',
  } as React.CSSProperties)

  return (
    <AppShell>
      <div className="px-8 py-7 w-full">


        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-3xl font-black" style={{ color: V.text }}>Jobs</h1>
            <p className="mt-1 text-sm" style={{ color: V.muted }}>
              {loading ? 'Loading…' : `${jobs.length} position${jobs.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <PrimaryBtn to="/jobs/new">
            <Plus className="size-4" /> Create New Job
          </PrimaryBtn>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {/* Dept pills */}
          {depts.map(d => (
            <button key={d} onClick={() => setDeptFilter(d)} style={pillStyle(deptFilter === d)}>{d}</button>
          ))}
          {/* Divider */}
          {depts.length > 1 && <div style={{ width: 1, height: 20, background: V.cardBorder, margin: '0 4px' }} />}
          {/* Status pills */}
          <button onClick={() => setStatusFilter('All')} style={pillStyle(statusFilter === 'All')}>All Status</button>
          <button onClick={() => setStatusFilter('published')} style={pillStyle(statusFilter === 'published')}>Active</button>
          <button onClick={() => setStatusFilter('closed')} style={pillStyle(statusFilter === 'closed', true)}>Closed</button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin" style={{ color: V.primary }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[18px] border-2 border-dashed py-20 text-center"
            style={{ borderColor: V.cardBorder, background: V.cardBg }}>
            <div className="flex size-14 items-center justify-center rounded-full mb-4"
              style={{ background: V.bgLight, boxShadow: CLAY.card }}>
              <Plus className="size-7" style={{ color: V.primary }} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: V.text }}>No jobs yet</h3>
            <p className="text-sm mb-5" style={{ color: V.muted }}>Create your first job posting to start building your pipeline.</p>
            <PrimaryBtn to="/jobs/new">Create New Job</PrimaryBtn>
          </div>
        )}

        {/* Job cards grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 gap-5">
            {filtered.map(job => {
              const meta        = STATUS_META[job.status] ?? STATUS_META.draft
              const isActioning = actioningId === job.id
              const isCopied    = copiedId === job.id

              return (
                <div key={job.id} className="group relative"
                  style={{ borderRadius: '18px', border: `1px solid ${V.cardBorder}`, background: V.cardBg, padding: '20px', boxShadow: CLAY.card, transition: 'all 200ms ease' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = CLAY.cardHover; el.style.transform = 'translateY(-2px)'; el.style.borderColor = V.border }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = CLAY.card; el.style.transform = ''; el.style.borderColor = V.cardBorder }}
                >
                  {/* Top badges row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: meta.bg, color: meta.text }}>{meta.label}</span>
                      {job.department && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                          style={{ background: 'hsl(150,14%,89%)', color: V.muted }}>{job.department}</span>
                      )}
                      {(job.open_positions ?? 1) > 0 && (
                        <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: V.bg, color: V.dark, border: `1px solid ${V.border}` }}>
                          <Users className="size-2.5" />{job.open_positions ?? 1} open
                        </span>
                      )}
                    </div>
                    <button onClick={() => navigate(`/jobs/${job.id}/edit`)} title="Edit job"
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex size-7 items-center justify-center rounded-lg"
                      style={{ color: V.muted, background: V.cardBg, border: `1px solid ${V.cardBorder}` }}>
                      <Pencil className="size-3.5" />
                    </button>
                  </div>

                  {/* Title + location */}
                  <h3 className="text-lg font-bold mb-0.5" style={{ color: V.text }}>{job.title}</h3>
                  {job.location && <p className="text-xs" style={{ color: V.muted }}>{job.location}</p>}

                  {/* Divider */}
                  <div className="my-4" style={{ height: 1, background: `linear-gradient(to right,${V.cardBorder},transparent)` }} />

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <GhostBtn onClick={() => navigate(`/pipeline?job=${job.id}`)}>
                      <GitBranch className="size-3.5" /> Pipeline
                    </GhostBtn>

                    {job.status === 'draft' && (
                      <PrimaryBtn onClick={() => handlePublish(job)} disabled={isActioning} className="!py-[6px] !px-[12px] !text-xs !rounded-[10px]">
                        {isActioning ? <Loader2 className="size-3 animate-spin" /> : <Globe className="size-3.5" />}
                        Publish
                      </PrimaryBtn>
                    )}

                    {(job.status === 'published' || job.status === 'open') && (
                      <>
                        {job.public_slug && (
                          <GhostBtn onClick={() => handleCopyLink(job)}>
                            {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                            {isCopied ? 'Copied!' : 'Copy Link'}
                          </GhostBtn>
                        )}
                        <GhostBtn onClick={() => handleClose(job)} disabled={isActioning} danger>
                          {isActioning ? <Loader2 className="size-3 animate-spin" /> : <Archive className="size-3.5" />}
                          Close
                        </GhostBtn>
                      </>
                    )}

                    {job.status === 'closed' && (
                      <GhostBtn onClick={() => handlePublish(job)} disabled={isActioning}>
                        {isActioning ? <Loader2 className="size-3 animate-spin" /> : <Globe className="size-3.5" />}
                        Reopen
                      </GhostBtn>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Post New Job card */}
            <Link to="/jobs/new" style={{ borderRadius: '18px', border: `2px dashed ${V.cardBorder}`, background: 'transparent', padding: '32px', transition: 'all 200ms ease', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' } as React.CSSProperties}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = V.bg; el.style.borderColor = V.border; el.style.boxShadow = CLAY.card; el.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = V.cardBorder; el.style.boxShadow = ''; el.style.transform = '' }}
            >
              <div className="flex size-12 items-center justify-center rounded-full mb-3"
                style={{ background: 'hsl(150,14%,89%)', boxShadow: '3px 3px 8px rgba(0,0,0,0.06),-2px -2px 6px rgba(255,255,255,0.65)' }}>
                <Plus className="size-6" style={{ color: V.muted }} />
              </div>
              <p className="font-semibold" style={{ color: V.muted }}>Post New Job</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(150,10%,65%)' }}>Start a new hiring cycle</p>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
