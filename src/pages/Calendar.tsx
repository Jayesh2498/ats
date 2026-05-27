/**
 * Calendar — full-page monthly view with interview tags on dates
 * Route: /calendar
 */
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Video, Phone, Building2, ClipboardList, CalendarDays } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { useUpcomingInterviews } from '@/hooks/useUpcomingInterviews'
import type { UpcomingInterview } from '@/hooks/useUpcomingInterviews'
import { CandidateDetailPanel } from '@/components/candidate-detail/CandidateDetailPanel'

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const FORMAT_ICON: Record<string, React.ReactNode> = {
  video:  <Video className="size-3 shrink-0" />,
  phone:  <Phone className="size-3 shrink-0" />,
  onsite: <Building2 className="size-3 shrink-0" />,
  async:  <ClipboardList className="size-3 shrink-0" />,
}

const V = {
  primary: '#40826D', dark: '#2F6F5E', bg: '#EEF6F3', border: '#B0D9CF',
  cardBg: 'hsl(152,14%,96%)', cardBorder: 'hsl(150,16%,87%)', muted: '#6B7C77',
}

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate() }
function getFirstDayOfWeek(year: number, month: number) { return new Date(year, month, 1).getDay() }

export default function Calendar() {
  const now   = new Date()
  const [viewDate, setViewDate]       = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate())
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const { interviews, loading } = useUpcomingInterviews()

  const year         = viewDate.getFullYear()
  const month        = viewDate.getMonth()
  const daysInMonth  = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfWeek(year, month)

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null) }
  function goToday()   { setViewDate(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDay(now.getDate()) }

  // Map interviews to day numbers for this month/year
  const interviewsByDay: Record<number, UpcomingInterview[]> = {}
  interviews.forEach(iv => {
    if (iv.scheduledAt.getFullYear() === year && iv.scheduledAt.getMonth() === month) {
      const d = iv.scheduledAt.getDate()
      if (!interviewsByDay[d]) interviewsByDay[d] = []
      interviewsByDay[d].push(iv)
    }
  })

  // Sort each day's interviews by time
  Object.values(interviewsByDay).forEach(arr => arr.sort((a, b) => +a.scheduledAt - +b.scheduledAt))

  const selectedInterviews = selectedDay ? (interviewsByDay[selectedDay] ?? []) : []

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = Math.ceil(cells.length / 7)

  const isToday      = (d: number) => d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear()

  const totalThisMonth = Object.values(interviewsByDay).reduce((s, a) => s + a.length, 0)

  return (
    <AppShell>
      <div className="h-full flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-8 py-4 border-b shrink-0"
          style={{ borderColor: V.cardBorder, background: 'hsl(152,14%,97%)' }}>
          {/* Left: title + stats */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black" style={{ color: '#1F2D2A' }}>Interview Calendar</h1>
              <p className="text-xs mt-0.5" style={{ color: V.muted }}>
                {loading
                  ? 'Syncing interviews…'
                  : `${totalThisMonth} interview${totalThisMonth !== 1 ? 's' : ''} in ${MONTHS[month]}${interviews.length !== totalThisMonth ? ` · ${interviews.length} total upcoming` : ''}`}
              </p>
            </div>
            {totalThisMonth > 0 && (
              <span className="flex h-6 min-w-6 px-1.5 items-center justify-center rounded-full text-[11px] font-black text-white"
                style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)' }}>
                {totalThisMonth}
              </span>
            )}
          </div>

          {/* Right: nav controls */}
          <div className="flex items-center gap-2">
            <button onClick={goToday}
              className="px-3 py-1.5 rounded-[10px] text-xs font-bold border transition-all"
              style={{ background: V.bg, borderColor: V.border, color: V.dark }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = V.border }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = V.bg }}>
              Today
            </button>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth}
                className="flex size-8 items-center justify-center rounded-[10px] border transition-all"
                style={{ background: V.cardBg, borderColor: V.cardBorder }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = V.border }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = V.cardBorder }}>
                <ChevronLeft className="size-4" style={{ color: V.muted }} />
              </button>
              <span className="text-sm font-bold min-w-[150px] text-center" style={{ color: '#1F2D2A' }}>
                {MONTHS[month]} {year}
              </span>
              <button onClick={nextMonth}
                className="flex size-8 items-center justify-center rounded-[10px] border transition-all"
                style={{ background: V.cardBg, borderColor: V.cardBorder }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = V.border }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = V.cardBorder }}>
                <ChevronRight className="size-4" style={{ color: V.muted }} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body: calendar + side panel ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Calendar grid ── */}
          <div className="flex-1 flex flex-col overflow-hidden border-r" style={{ borderColor: V.cardBorder }}>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b shrink-0" style={{ borderColor: V.cardBorder, background: 'hsl(152,14%,97%)' }}>
              {DAYS.map((d, i) => (
                <div key={d} className="py-3 text-center text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: i === 0 || i === 6 ? '#9BB5AD' : V.muted }}>
                  <span className="hidden md:inline">{d}</span>
                  <span className="md:hidden">{DAYS_SHORT[i]}</span>
                </div>
              ))}
            </div>

            {/* Cells — fill remaining height equally */}
            <div className="flex-1 grid grid-cols-7 overflow-hidden"
              style={{ gridTemplateRows: `repeat(${weeks}, 1fr)` }}>
              {cells.map((day, i) => {
                const dayIvs    = day ? (interviewsByDay[day] ?? []) : []
                const hasIvs    = dayIvs.length > 0
                const isSelected = day === selectedDay
                const isTodayCell = day ? isToday(day) : false
                const isWeekend = i % 7 === 0 || i % 7 === 6

                return (
                  <div key={i}
                    onClick={() => day && setSelectedDay(isSelected ? null : day)}
                    className="border-b border-r flex flex-col overflow-hidden transition-colors"
                    style={{
                      borderColor: V.cardBorder,
                      background: isSelected
                        ? 'hsl(152,22%,93%)'
                        : isTodayCell
                          ? 'hsl(152,18%,95%)'
                          : isWeekend
                            ? 'hsl(152,10%,97%)'
                            : '#fff',
                      cursor: day ? 'pointer' : 'default',
                    }}
                    onMouseEnter={e => { if (day && !isSelected) (e.currentTarget as HTMLElement).style.background = 'hsl(150,18%,94%)' }}
                    onMouseLeave={e => {
                      if (!isSelected)
                        (e.currentTarget as HTMLElement).style.background = isTodayCell ? 'hsl(152,18%,95%)' : isWeekend ? 'hsl(152,10%,97%)' : '#fff'
                    }}
                  >
                    {day && (
                      <div className="flex flex-col h-full p-1.5 gap-1">
                        {/* Day number */}
                        <div className="shrink-0">
                          <span className="inline-flex size-6 items-center justify-center rounded-full text-xs font-bold"
                            style={isTodayCell ? {
                              background: `linear-gradient(135deg,${V.primary},${V.dark})`,
                              color: '#fff',
                              boxShadow: '2px 2px 6px rgba(64,130,109,0.30)',
                            } : {
                              color: isSelected ? V.dark : isWeekend ? '#9BB5AD' : '#1F2D2A',
                              fontWeight: isTodayCell || isSelected ? '800' : '600',
                            }}>
                            {day}
                          </span>
                        </div>

                        {/* Interview tags */}
                        {hasIvs && (
                          <div className="flex flex-col gap-0.5 overflow-hidden flex-1 min-h-0">
                            {dayIvs.slice(0, 3).map(iv => {
                              const time = iv.scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                              const firstName = iv.candidateName.split(' ')[0]
                              return (
                                <div
                                  key={iv.id}
                                  onClick={e => { e.stopPropagation(); setSelectedAppId(iv.applicationId) }}
                                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate cursor-pointer transition-all group"
                                  style={{ background: V.bg, color: V.dark, border: `1px solid ${V.border}` }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#D6EDE7'; (e.currentTarget as HTMLElement).style.borderColor = V.primary }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = V.bg; (e.currentTarget as HTMLElement).style.borderColor = V.border }}
                                  title={`${iv.candidateName} — ${iv.jobTitle} at ${time}`}
                                >
                                  <span style={{ color: V.primary, flexShrink: 0 }}>{FORMAT_ICON[iv.format]}</span>
                                  <span className="truncate">{firstName}</span>
                                  <span className="text-[9px] opacity-70 shrink-0 hidden lg:inline">{time}</span>
                                </div>
                              )
                            })}
                            {dayIvs.length > 3 && (
                              <div className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                                style={{ background: '#D6EDE7', color: V.dark }}>
                                +{dayIvs.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Side panel ── */}
          <div className="w-72 shrink-0 flex flex-col overflow-hidden" style={{ background: 'hsl(152,14%,97%)' }}>
            {/* Panel header */}
            <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: V.cardBorder }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: V.muted }}>
                {selectedDay
                  ? `${DAYS[new Date(year, month, selectedDay).getDay()]}, ${MONTHS[month]} ${selectedDay}`
                  : `${MONTHS[month]} ${year}`}
              </p>
              {selectedDay ? (
                <p className="text-sm font-semibold" style={{ color: '#1F2D2A' }}>
                  {selectedInterviews.length === 0
                    ? 'No interviews'
                    : `${selectedInterviews.length} interview${selectedInterviews.length !== 1 ? 's' : ''}`}
                </p>
              ) : (
                <p className="text-sm font-semibold" style={{ color: '#1F2D2A' }}>
                  {totalThisMonth} interviews this month
                </p>
              )}
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
              {/* No day selected — show month overview */}
              {!selectedDay && (
                <>
                  {Object.keys(interviewsByDay).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CalendarDays className="size-10 mb-3 opacity-20" style={{ color: V.muted }} />
                      <p className="text-sm font-semibold" style={{ color: V.muted }}>No interviews this month</p>
                      <p className="text-xs mt-1" style={{ color: '#9BB5AD' }}>Move candidates to Interview stage</p>
                    </div>
                  ) : (
                    Object.entries(interviewsByDay)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([d, ivs]) => (
                        <div key={d}>
                          <button
                            onClick={() => setSelectedDay(Number(d))}
                            className="w-full text-left"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 hover:underline"
                              style={{ color: V.primary }}>
                              {MONTHS[month]} {d}
                            </p>
                          </button>
                          {ivs.slice(0, 2).map(iv => (
                            <InterviewCard key={iv.id} iv={iv} onClick={() => setSelectedAppId(iv.applicationId)} />
                          ))}
                          {ivs.length > 2 && (
                            <p className="text-[11px] font-semibold px-1" style={{ color: V.muted }}>+{ivs.length - 2} more</p>
                          )}
                        </div>
                      ))
                  )}
                </>
              )}

              {/* Day selected — no interviews */}
              {selectedDay && selectedInterviews.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Video className="size-10 mb-3 opacity-20" style={{ color: V.muted }} />
                  <p className="text-sm font-semibold" style={{ color: V.muted }}>No interviews scheduled</p>
                  {isCurrentMonth && (
                    <p className="text-xs mt-1" style={{ color: '#9BB5AD' }}>Move a candidate to Interview stage to schedule one</p>
                  )}
                </div>
              )}

              {/* Day selected — show interviews */}
              {selectedDay && selectedInterviews.map(iv => (
                <InterviewCard key={iv.id} iv={iv} onClick={() => setSelectedAppId(iv.applicationId)} expanded />
              ))}
            </div>

            {/* Panel footer — legend */}
            <div className="px-5 py-3 border-t shrink-0" style={{ borderColor: V.cardBorder }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#9BB5AD' }}>Format</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { key: 'video',  label: 'Video' },
                  { key: 'phone',  label: 'Phone' },
                  { key: 'onsite', label: 'On-site' },
                  { key: 'async',  label: 'Async' },
                ].map(f => (
                  <span key={f.key} className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: V.muted }}>
                    <span style={{ color: V.primary }}>{FORMAT_ICON[f.key]}</span> {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CandidateDetailPanel
        applicationId={selectedAppId}
        open={!!selectedAppId}
        onClose={() => setSelectedAppId(null)}
        defaultTab="activity"
      />
    </AppShell>
  )
}

// ── Interview card for side panel ─────────────────────────────
function InterviewCard({ iv, onClick, expanded = false }: {
  iv: UpcomingInterview
  onClick: () => void
  expanded?: boolean
}) {
  const time     = iv.scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const initials = iv.candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      onClick={onClick}
      className="rounded-xl border p-3 cursor-pointer transition-all"
      style={{ borderColor: V.border, background: V.bg }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#D6EDE7'; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 4px 12px rgba(64,130,109,0.12)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = V.bg; el.style.transform = ''; el.style.boxShadow = '' }}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#5A9C87,#40826D)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-bold truncate" style={{ color: '#1F2D2A' }}>{iv.candidateName}</p>
            <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold shrink-0"
              style={{ background: '#D6EDE7', color: V.dark }}>
              {FORMAT_ICON[iv.format]}
            </span>
          </div>
          <p className="text-[11px] truncate" style={{ color: V.muted }}>{iv.jobTitle}</p>
          {expanded && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-bold" style={{ color: V.primary }}>{time}</span>
              {iv.durationMins && (
                <span className="text-[10px]" style={{ color: '#9BB5AD' }}>{iv.durationMins} min</span>
              )}
            </div>
          )}
          {!expanded && (
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: V.primary }}>{time}</p>
          )}
        </div>
      </div>
    </div>
  )
}
