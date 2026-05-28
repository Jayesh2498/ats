/**
 * Public offer acceptance page — no auth required.
 * Route: /offer/:token
 */
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle,
  DollarSign, CalendarDays, ChevronDown, ChevronUp, BadgeCheck,
  Building2, Loader2, Download, Printer,
} from 'lucide-react'
import { useOffers } from '@/hooks/useOffers'
import { AtsIcon } from '@/components/AtsIcon'
import type { Offer } from '@/types/offer'
import { formatDistanceToNow, format, isPast } from 'date-fns'

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

// ── T&C clauses ───────────────────────────────────────────────
const TC_CLAUSES = [
  { title: '1. At-Will Employment',           body: 'Your employment with the Company is at-will, meaning either you or the Company may terminate the employment relationship at any time, with or without cause or advance notice, subject to applicable law.' },
  { title: '2. Compensation',                 body: 'You will be paid the salary stated in this offer, payable in accordance with the Company\'s standard payroll schedule. The Company reserves the right to adjust compensation in line with performance reviews and market benchmarks.' },
  { title: '3. Confidentiality',              body: 'As a condition of your employment, you agree to keep confidential all proprietary information, trade secrets, business strategies, client data, and other sensitive information belonging to the Company, both during and after your employment.' },
  { title: '4. Intellectual Property',        body: 'Any inventions, developments, works of authorship, or other intellectual property created by you in the scope of your employment shall be the exclusive property of the Company. You hereby assign all rights, title, and interest therein to the Company.' },
  { title: '5. Background Check',             body: 'This offer is contingent upon the successful completion of a background check, including but not limited to identity verification, employment history, and criminal record (where legally permissible). The Company will notify you of any adverse findings.' },
  { title: '6. Non-Solicitation',             body: 'During your employment and for a period of twelve (12) months following termination, you agree not to solicit or attempt to solicit any employee, contractor, or client of the Company for your own benefit or that of a third party.' },
  { title: '7. Code of Conduct',              body: 'You agree to adhere to the Company\'s policies, procedures, and Code of Conduct, as updated from time to time. Violation of these policies may result in disciplinary action, up to and including termination.' },
  { title: '8. Benefits & Amendments',        body: 'Benefits described in this offer are subject to change at the Company\'s discretion in line with company-wide policy updates. The terms of this offer may only be amended in writing and signed by an authorised representative of the Company.' },
  { title: '9. Governing Law',                body: 'This offer and any disputes arising out of or relating to your employment shall be governed by the laws of the jurisdiction in which the Company\'s principal place of business is located, without regard to conflict-of-law principles.' },
  { title: '10. Entire Agreement',            body: 'This offer letter constitutes the entire agreement between you and the Company with respect to the subject matter hereof and supersedes all prior representations, discussions, negotiations, and undertakings, whether written or oral.' },
]

type PageState = 'loading' | 'not_found' | 'ready' | 'responded' | 'expired'

// ── Export / Print helper ──────────────────────────────────────
function printOffer(offer: Offer) {
  const startDate = offer.start_date ? format(new Date(offer.start_date), 'MMMM d, yyyy') : 'To be confirmed'
  const expiryDate = offer.expires_at ? format(new Date(offer.expires_at), 'd MMMM yyyy') : '—'

  const clauses = TC_CLAUSES.map(c => `
    <div style="margin-bottom:14px">
      <p style="font-weight:700;font-size:10px;color:#2F6F5E;margin:0 0 3px 0">${c.title}</p>
      <p style="font-size:10px;line-height:1.6;color:#4B5563;margin:0">${c.body}</p>
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Offer Letter — ${offer.job_title} — ${offer.candidate_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; color: #1F2D2A; background: #fff; }
    .page { max-width: 720px; margin: 0 auto; padding: 48px 56px; }
    .header { text-align: center; padding-bottom: 28px; border-bottom: 2px solid #B0D9CF; margin-bottom: 28px; }
    .logo-bar { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:20px; }
    .logo-dot { width:28px; height:28px; background:linear-gradient(135deg,#40826D,#2F6F5E); border-radius:8px; display:flex; align-items:center; justify-content:center; }
    .logo-dot span { color:#fff; font-size:14px; font-weight:900; }
    .company-name { font-size:13px; font-weight:800; color:#1F2D2A; }
    .doc-label { font-size:9px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:#6B7C77; margin-bottom:6px; }
    h1 { font-size:26px; font-weight:900; color:#1F2D2A; margin-bottom:6px; }
    .subtitle { font-size:13px; color:#6B7C77; }
    .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:0; border:1px solid #B0D9CF; border-radius:10px; overflow:hidden; margin:24px 0; }
    .stat { padding:14px 16px; text-align:center; }
    .stat + .stat { border-left:1px solid #B0D9CF; }
    .stat-label { font-size:8.5px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:#6B7C77; margin-bottom:4px; }
    .stat-value { font-size:13px; font-weight:700; color:#1F2D2A; }
    .letter-box { background:#EEF6F3; border:1px solid #B0D9CF; border-radius:10px; padding:24px 28px; margin-bottom:28px; }
    .letter-box p { font-size:12.5px; line-height:1.75; color:#1F2D2A; margin-bottom:12px; }
    .letter-box p:last-child { margin-bottom:0; }
    .section-label { font-size:9px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:#6B7C77; margin-bottom:10px; }
    .tc-box { border:1px solid #D6EDE7; border-radius:10px; padding:20px 24px; margin-bottom:28px; background:#FAFAFA; }
    .signature-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-top:36px; padding-top:24px; border-top:1px solid #B0D9CF; }
    .sig-block p { font-size:11px; color:#6B7C77; margin-bottom:4px; }
    .sig-line { height:1px; background:#D1D5DB; margin: 32px 0 6px 0; }
    .sig-name { font-size:12px; font-weight:700; color:#1F2D2A; }
    .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:10px; font-weight:700;
      background:${offer.status === 'accepted' ? '#D1FAE5' : offer.status === 'declined' ? '#FEE2E2' : '#FEF3C7'};
      color:${offer.status === 'accepted' ? '#065F46' : offer.status === 'declined' ? '#991B1B' : '#92400E'}; }
    .footer { text-align:center; margin-top:40px; padding-top:16px; border-top:1px solid #E5E7EB; font-size:10px; color:#9CA3AF; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 32px 40px; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-bar">
      <div class="logo-dot"><span>H</span></div>
      <span class="company-name">${offer.company_name ?? 'TalentFlow Inc.'}</span>
    </div>
    <p class="doc-label">Offer of Employment</p>
    <h1>${offer.job_title}</h1>
    <p class="subtitle">Prepared for <strong>${offer.candidate_name}</strong> · ${format(new Date(offer.created_at), 'd MMM yyyy')}</p>
    ${offer.status !== 'pending' ? `<div style="margin-top:10px"><span class="status-badge">${offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}</span></div>` : ''}
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Compensation</div>
      <div class="stat-value">${offer.salary ?? '—'}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Start Date</div>
      <div class="stat-value">${startDate}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Employment</div>
      <div class="stat-value">${offer.role_type ?? 'Full-time'}</div>
    </div>
  </div>

  <div class="letter-box">
    <p class="section-label">Offer Letter</p>
    <p>Dear <strong>${offer.candidate_name}</strong>,</p>
    <p>We are delighted to extend this offer of <strong>${offer.role_type ?? 'full-time'}</strong> employment for the position of <strong>${offer.job_title}</strong> at <strong>${offer.company_name ?? 'our company'}</strong>. Following our recent conversations and careful consideration, we believe you will be an exceptional addition to our team.</p>
    <p>This offer includes a base compensation of <strong>${offer.salary}</strong> per annum, paid in accordance with our standard payroll schedule. Your proposed start date is <strong>${startDate}</strong>. This position is subject to the terms and conditions outlined below.</p>
    ${offer.benefits ? `<p>In addition to your base salary, you will be entitled to our comprehensive benefits package: <strong>${offer.benefits}</strong>.</p>` : ''}
    ${offer.notes ? `<p><strong>Additional details:</strong> ${offer.notes}</p>` : ''}
    <p>We look forward to welcoming you aboard. Please review the Terms & Conditions below carefully before responding.</p>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #B0D9CF">
      <p>Yours sincerely,</p>
      <p><strong>The Hiring Team</strong><br><span style="font-size:11px;color:#6B7C77">${offer.company_name ?? 'TalentFlow Inc.'}</span></p>
    </div>
  </div>

  <div class="tc-box">
    <p class="section-label">Terms &amp; Conditions</p>
    ${clauses}
  </div>

  <div style="background:#EEF6F3;border:1px solid #B0D9CF;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:11px;color:#4B5563">
    <strong style="color:#2F6F5E">Offer Validity:</strong> This offer expires on <strong>${expiryDate}</strong>.
    ${offer.responded_at ? ` · <strong>Candidate responded:</strong> ${format(new Date(offer.responded_at), 'd MMM yyyy')}` : ''}
  </div>

  <div class="signature-grid">
    <div class="sig-block">
      <p>Candidate signature</p>
      <div class="sig-line"></div>
      <span class="sig-name">${offer.candidate_name}</span>
      <p style="margin-top:4px">Date: _______________</p>
    </div>
    <div class="sig-block">
      <p>Authorised signatory</p>
      <div class="sig-line"></div>
      <span class="sig-name">${offer.company_name ?? 'Company Representative'}</span>
      <p style="margin-top:4px">Date: _______________</p>
    </div>
  </div>

  <div class="footer">
    Generated by ATS · Confidential · ${format(new Date(), 'd MMM yyyy')}
  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=800')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  // Slight delay to allow render before print dialog
  setTimeout(() => { win.print() }, 350)
}

export default function OfferAcceptance() {
  const { token } = useParams<{ token: string }>()
  const { getOfferByToken, respondToOffer } = useOffers()

  const [offer, setOffer]                   = useState<Offer | null>(null)
  const [pageState, setPageState]           = useState<PageState>('loading')
  const [responding, setResponding]         = useState(false)
  const [responseAction, setResponseAction] = useState<'accepted' | 'declined' | null>(null)
  const [tcExpanded, setTcExpanded]         = useState(false)
  const [tcAgreed, setTcAgreed]             = useState(false)

  useEffect(() => {
    if (!token) { setPageState('not_found'); return }
    getOfferByToken(token).then(o => {
      if (!o) { setPageState('not_found'); return }
      setOffer(o)
      if (o.status !== 'pending')            setPageState('responded')
      else if (isPast(new Date(o.expires_at))) setPageState('expired')
      else                                    setPageState('ready')
    })
  }, [token, getOfferByToken])

  async function handleRespond(action: 'accepted' | 'declined') {
    if (!token || responding) return
    setResponding(true)
    setResponseAction(action)
    const ok = await respondToOffer(token, action)
    if (ok) {
      setOffer(prev => prev ? { ...prev, status: action } : prev)
      setPageState('responded')
    }
    setResponding(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${V.bg50} 0%, #fff 50%, ${V.bg50} 100%)` }}>

      {/* Brand bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: V.border, background: '#fff' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl shadow-sm"
            style={{ background: `linear-gradient(135deg, ${V.primary}, ${V.dark})` }}>
            <AtsIcon size={16} color="white" />
          </div>
          <span className="text-sm font-extrabold" style={{ color: V.text }}>ATS</span>
        </div>
        {/* Export button — visible whenever an offer is loaded */}
        {offer && (
          <button
            onClick={() => printOffer(offer)}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all hover:shadow-sm"
            style={{ borderColor: V.border, color: V.primary, background: V.bg50 }}
          >
            <Printer className="size-3.5" />
            Export / Print
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-4 py-10 pb-16">
        <div className="w-full max-w-2xl">
          <div className="rounded-3xl overflow-hidden border shadow-md"
            style={{ background: '#fff', borderColor: V.border, boxShadow: `0 12px 40px rgba(64,130,109,0.10), 0 2px 8px rgba(0,0,0,0.04)` }}>

            {/* ── Loading ── */}
            {pageState === 'loading' && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="size-7 animate-spin" style={{ color: V.primary }} />
                <p className="text-sm" style={{ color: V.muted }}>Loading your offer…</p>
              </div>
            )}

            {/* ── Not found ── */}
            {pageState === 'not_found' && (
              <div className="flex flex-col items-center gap-4 py-32 px-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl" style={{ background: '#FEF3C7' }}>
                  <AlertTriangle className="size-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: V.text }}>Offer not found</h2>
                <p className="text-sm max-w-xs" style={{ color: V.muted }}>
                  This link may be invalid or has already expired. Please contact your recruiter.
                </p>
              </div>
            )}

            {/* ── Expired ── */}
            {pageState === 'expired' && offer && (
              <div className="flex flex-col items-center gap-4 py-32 px-8 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl" style={{ background: '#F3F4F6' }}>
                  <Clock className="size-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: V.text }}>Offer expired</h2>
                <p className="text-sm max-w-xs" style={{ color: V.muted }}>
                  This offer for <strong style={{ color: V.text }}>{offer.job_title}</strong> expired{' '}
                  {formatDistanceToNow(new Date(offer.expires_at), { addSuffix: true })}.
                  Please contact your recruiter to discuss next steps.
                </p>
              </div>
            )}

            {/* ── Responded ── */}
            {pageState === 'responded' && offer && (
              <div className="flex flex-col items-center gap-5 py-20 px-8 text-center">
                {offer.status === 'accepted' ? (
                  <>
                    <div className="flex size-20 items-center justify-center rounded-full"
                      style={{ background: V.bg50, border: `2px solid ${V.border}` }}>
                      <CheckCircle2 className="size-10" style={{ color: V.primary }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black" style={{ color: V.text }}>Offer Accepted! 🎉</h2>
                      <p className="mt-3 text-sm leading-relaxed max-w-sm mx-auto" style={{ color: V.muted }}>
                        Congratulations, <strong style={{ color: V.text }}>{offer.candidate_name}</strong>!
                        You've accepted the role of <strong style={{ color: V.text }}>{offer.job_title}</strong> at{' '}
                        <strong style={{ color: V.text }}>{offer.company_name ?? 'the company'}</strong>.
                      </p>
                      <p className="mt-2 text-sm" style={{ color: V.muted }}>
                        Your recruiter will be in touch shortly with next steps.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex size-20 items-center justify-center rounded-full bg-red-50">
                      <XCircle className="size-10 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black" style={{ color: V.text }}>Offer Declined</h2>
                      <p className="mt-3 text-sm leading-relaxed max-w-sm mx-auto" style={{ color: V.muted }}>
                        You have declined the offer for <strong style={{ color: V.text }}>{offer.job_title}</strong>.
                        Thank you for letting us know — we wish you all the best.
                      </p>
                    </div>
                  </>
                )}
                {/* Download offer letter after responding */}
                <button
                  onClick={() => printOffer(offer)}
                  className="mt-2 flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all hover:shadow-sm"
                  style={{ borderColor: V.border, color: V.primary, background: V.bg50 }}
                >
                  <Download className="size-4" />
                  Download Offer Letter &amp; T&amp;Cs
                </button>
              </div>
            )}

            {/* ── READY ── */}
            {pageState === 'ready' && offer && (
              <>
                {/* ① Hero gradient header */}
                <div className="px-10 py-10 text-center"
                  style={{ background: `linear-gradient(135deg, ${V.primary} 0%, ${V.dark} 100%)` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                    style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Offer of Employment
                  </p>
                  <h1 className="text-3xl font-black text-white leading-tight">{offer.job_title}</h1>
                  <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    Prepared for <span className="font-bold text-white">{offer.candidate_name}</span>
                  </p>
                  {offer.company_name && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold"
                      style={{ background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.90)' }}>
                      <Building2 className="size-3" />{offer.company_name}
                    </div>
                  )}
                </div>

                {/* ② Key details strip */}
                <div className="grid grid-cols-3 border-b" style={{ borderColor: V.border }}>
                  <DetailTile icon={<DollarSign className="size-4" />} label="Compensation" value={offer.salary} border="right" />
                  <DetailTile icon={<CalendarDays className="size-4" />} label="Start Date"
                    value={offer.start_date ? format(new Date(offer.start_date), 'MMM d, yyyy') : 'TBC'} border="right" />
                  <DetailTile icon={<BadgeCheck className="size-4" />} label="Employment" value={offer.role_type ?? 'Full-time'} />
                </div>

                {/* ③ Offer letter body */}
                <div className="px-10 py-8">
                  <div className="rounded-2xl border p-7 space-y-4" style={{ borderColor: V.border, background: V.bg50 }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: V.muted }}>
                      Offer Letter
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: V.text }}>
                      Dear <strong>{offer.candidate_name}</strong>,
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: V.text }}>
                      We are delighted to extend this offer of <strong>{offer.role_type ?? 'full-time'}</strong>{' '}
                      employment for the position of <strong>{offer.job_title}</strong> at{' '}
                      <strong>{offer.company_name ?? 'our company'}</strong>. Following our recent conversations
                      and careful consideration, we believe you will be an exceptional addition to our team.
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: V.text }}>
                      This offer includes a base compensation of <strong>{offer.salary}</strong> per annum,
                      paid in accordance with our standard payroll schedule.
                      {offer.start_date && (
                        <> Your proposed start date is{' '}
                          <strong>{format(new Date(offer.start_date), 'MMMM d, yyyy')}</strong>.
                        </>
                      )}{' '}
                      This position is subject to the terms and conditions outlined below.
                    </p>
                    {offer.benefits && (
                      <p className="text-sm leading-relaxed" style={{ color: V.text }}>
                        In addition to your base salary, you will be entitled to our comprehensive benefits
                        package: <strong>{offer.benefits}</strong>.
                      </p>
                    )}
                    {offer.notes && (
                      <p className="text-sm leading-relaxed" style={{ color: V.text }}>
                        <strong>Additional details:</strong> {offer.notes}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed" style={{ color: V.text }}>
                      We look forward to welcoming you aboard and are excited about the contributions you will
                      bring to our team. Please review the Terms & Conditions below and indicate your response.
                    </p>
                    <div className="pt-3 border-t" style={{ borderColor: V.border }}>
                      <p className="text-sm" style={{ color: V.text }}>Yours sincerely,</p>
                      <p className="mt-1 text-sm font-bold" style={{ color: V.text }}>The Hiring Team</p>
                      <p className="text-xs mt-0.5" style={{ color: V.muted }}>{offer.company_name ?? 'TalentFlow Inc.'}</p>
                    </div>
                  </div>
                </div>

                {/* ④ Terms & Conditions — compact */}
                <div className="px-10 pb-2">
                  <button
                    onClick={() => setTcExpanded(v => !v)}
                    className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-semibold transition-all"
                    style={{
                      borderColor: tcExpanded ? V.primary : V.border,
                      background: tcExpanded ? V.bg50 : '#fff',
                      color: V.text,
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck className="size-3.5" style={{ color: V.primary }} />
                      Terms & Conditions
                    </span>
                    {tcExpanded
                      ? <ChevronUp className="size-3.5" style={{ color: V.muted }} />
                      : <ChevronDown className="size-3.5" style={{ color: V.muted }} />}
                  </button>

                  {tcExpanded && (
                    <div className="mt-1.5 rounded-xl border overflow-hidden" style={{ borderColor: V.border }}>
                      <div className="overflow-y-auto max-h-48 px-5 py-4 space-y-3.5"
                        style={{ background: '#fafafa' }}>
                        {TC_CLAUSES.map(clause => (
                          <div key={clause.title}>
                            <p className="text-[10px] font-bold mb-0.5" style={{ color: V.dark }}>{clause.title}</p>
                            <p className="text-[10px] leading-relaxed" style={{ color: V.muted }}>{clause.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* T&C checkbox */}
                  <label className="mt-3 flex items-center gap-2.5 cursor-pointer">
                    <div
                      onClick={() => setTcAgreed(v => !v)}
                      className="flex size-4 shrink-0 items-center justify-center rounded border-2 transition-all cursor-pointer"
                      style={{
                        borderColor: tcAgreed ? V.primary : V.border,
                        background: tcAgreed ? V.primary : '#fff',
                      }}
                    >
                      {tcAgreed && <CheckCircle2 className="size-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-[11px] leading-relaxed select-none" style={{ color: V.muted }}
                      onClick={() => setTcAgreed(v => !v)}>
                      I have read and agree to the{' '}
                      <button type="button" className="font-semibold underline underline-offset-2"
                        style={{ color: V.primary }}
                        onClick={e => { e.stopPropagation(); setTcExpanded(true) }}>
                        Terms & Conditions
                      </button>{' '}
                      of this offer of employment.
                    </span>
                  </label>
                </div>

                {/* ⑤ Expiry notice — slim */}
                <div className="px-10 pt-4 pb-1">
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2"
                    style={{ borderColor: '#FDE68A', background: '#FFFBEB' }}>
                    <Clock className="size-3 shrink-0 text-amber-500" />
                    <p className="text-[11px] text-amber-700">
                      Expires <strong>{formatDistanceToNow(new Date(offer.expires_at), { addSuffix: true })}</strong>
                      <span className="text-amber-600 font-normal"> · {format(new Date(offer.expires_at), 'd MMM yyyy')}</span>
                    </p>
                  </div>
                </div>

                {/* ⑥ Action buttons */}
                <div className="px-10 pb-10 pt-4 space-y-3">
                  <button
                    onClick={() => handleRespond('accepted')}
                    disabled={responding || !tcAgreed}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: tcAgreed ? `linear-gradient(135deg, ${V.primary}, ${V.dark})` : '#D1D5DB',
                      boxShadow: tcAgreed ? `0 4px 14px rgba(64,130,109,0.30)` : 'none',
                    }}
                  >
                    {responding && responseAction === 'accepted'
                      ? <Loader2 className="size-4 animate-spin" />
                      : <CheckCircle2 className="size-4" />}
                    {responding && responseAction === 'accepted' ? 'Accepting…' : 'Accept Offer'}
                  </button>

                  <button
                    onClick={() => handleRespond('declined')}
                    disabled={responding}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-bold transition-all hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: '#FECACA', color: '#DC2626' }}
                  >
                    {responding && responseAction === 'declined'
                      ? <Loader2 className="size-4 animate-spin" />
                      : <XCircle className="size-4" />}
                    {responding && responseAction === 'declined' ? 'Declining…' : 'Decline Offer'}
                  </button>

                  {/* Export / Save a copy */}
                  <div className="pt-1 border-t" style={{ borderColor: V.border }}>
                    <button
                      onClick={() => printOffer(offer)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all hover:shadow-sm"
                      style={{ borderColor: V.border, color: V.muted, background: '#FAFAFA' }}
                    >
                      <Download className="size-3.5" />
                      Save / Print Offer Letter &amp; T&amp;Cs
                    </button>
                  </div>

                  {!tcAgreed && (
                    <p className="text-center text-[11px]" style={{ color: V.muted }}>
                      Agree to the Terms & Conditions above to accept this offer.
                    </p>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 text-center">
        <p className="text-[11px]" style={{ color: V.muted }}>
          Powered by <strong style={{ color: V.primary }}>ATS</strong> · Questions? Contact your recruiter directly.
        </p>
      </footer>
    </div>
  )
}

// ── Detail tile ────────────────────────────────────────────────
function DetailTile({ icon, label, value, border }: {
  icon: React.ReactNode; label: string; value: string; border?: 'right'
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-5"
      style={border === 'right' ? { borderRight: `1px solid ${V.border}` } : {}}>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: V.muted }}>
        <span style={{ color: V.primary }}>{icon}</span>{label}
      </div>
      <p className="text-sm font-bold text-center leading-snug" style={{ color: V.text }}>{value}</p>
    </div>
  )
}
