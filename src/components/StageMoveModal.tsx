import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

export type StageName = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired'

export const FIXED_STAGES: Array<{ name: StageName; order_index: number; color: string }> = [
  { name: 'Applied' as StageName,   order_index: 0, color: 'gray'   },
  { name: 'Screening' as StageName, order_index: 1, color: 'blue'   },
  { name: 'Interview' as StageName, order_index: 2, color: 'violet' },
  { name: 'Offer' as StageName,     order_index: 3, color: 'amber'  },
  { name: 'Hired' as StageName,     order_index: 4, color: 'green'  },
]

export function stageColor(name: string): { dot: string; badge: string; badgeText: string } {
  switch (name) {
    case 'Applied':
      return { dot: 'bg-gray-400', badge: 'bg-gray-100', badgeText: 'text-gray-600' }
    case 'Screening':
      return { dot: 'bg-blue-400', badge: 'bg-blue-100', badgeText: 'text-blue-700' }
    case 'Interview':
      return { dot: 'bg-violet-400', badge: 'bg-violet-100', badgeText: 'text-violet-700' }
    case 'Offer':
      return { dot: 'bg-amber-400', badge: 'bg-amber-100', badgeText: 'text-amber-700' }
    case 'Hired':
      return { dot: 'bg-emerald-500', badge: 'bg-emerald-100', badgeText: 'text-emerald-700' }
    default:
      return { dot: 'bg-gray-400', badge: 'bg-gray-100', badgeText: 'text-gray-600' }
  }
}

interface Props {
  open: boolean
  candidateName: string
  fromStage: StageName
  toStage: StageName
  onConfirm: (inputData: Record<string, string>) => void
  onCancel: () => void
}

function StageBadge({ name }: { name: StageName }) {
  const colors = stageColor(name)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors.badge} ${colors.badgeText}`}
    >
      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      {name}
    </span>
  )
}

export default function StageMoveModal({
  open,
  candidateName,
  fromStage,
  toStage,
  onConfirm,
  onCancel,
}: Props): JSX.Element {
  const [screeningNotes, setScreeningNotes] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewTime, setInterviewTime] = useState('')
  const [interviewFormat, setInterviewFormat] = useState<'video' | 'phone' | 'onsite' | 'async'>('video')
  const [salary, setSalary] = useState('')
  const [startDate, setStartDate] = useState('')

  useEffect(() => {
    if (open) {
      setScreeningNotes('')
      setInterviewDate('')
      setInterviewTime('')
      setInterviewFormat('video')
      setSalary('')
      setStartDate('')
    }
  }, [open, toStage])

  function handleConfirm() {
    let inputData: Record<string, string> = {}

    if (toStage === 'Screening') {
      inputData = { screening_notes: screeningNotes }
    } else if (toStage === 'Interview') {
      inputData = {
        interview_date: interviewDate,
        interview_time: interviewTime,
        interview_format: interviewFormat,
      }
    } else if (toStage === 'Offer') {
      inputData = { salary, start_date: startDate }
    }

    onConfirm(inputData)
  }

  if (!open) return <></>

  const inputBase =
    'w-full px-3 py-2 rounded-xl text-sm text-gray-800 border outline-none transition'
  const inputStyle = {
    background: 'rgba(64,130,109,0.04)',
    borderColor: 'rgba(64,130,109,0.25)',
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = '#40826D'
  }
  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.currentTarget.style.borderColor = 'rgba(64,130,109,0.25)'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1.5px solid rgba(64,130,109,0.18)',
          boxShadow: '0 8px 32px 0 rgba(64,130,109,0.18), 0 2px 8px 0 rgba(0,0,0,0.10)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, #40826D 0%, #52a98c 100%)' }}
        >
          <p className="text-white font-semibold text-lg">Move Candidate</p>
          <p className="text-white/80 text-sm mt-0.5 truncate">{candidateName}</p>
        </div>

        {/* Stage transition indicator */}
        <div className="flex items-center justify-center gap-3 px-6 pt-5">
          <StageBadge name={fromStage} />
          <ArrowRight size={16} className="text-[#40826D] shrink-0" />
          <StageBadge name={toStage} />
        </div>

        {/* Stage-specific inputs */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {toStage === 'Screening' && (
            <div>
              <label className="block text-xs font-semibold text-[#40826D] mb-1 uppercase tracking-wide">
                Screening Notes
              </label>
              <textarea
                value={screeningNotes}
                onChange={(e) => setScreeningNotes(e.target.value)}
                placeholder="Add notes about this candidate's screening…"
                rows={4}
                className={inputBase + ' resize-y'}
                style={{ ...inputStyle, minHeight: '100px' }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          )}

          {toStage === 'Interview' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#40826D] mb-1 uppercase tracking-wide">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className={inputBase}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#40826D] mb-1 uppercase tracking-wide">
                    Interview Time
                  </label>
                  <input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className={inputBase}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#40826D] mb-1 uppercase tracking-wide">
                  Interview Format
                </label>
                <select
                  value={interviewFormat}
                  onChange={(e) =>
                    setInterviewFormat(e.target.value as 'video' | 'phone' | 'onsite' | 'async')
                  }
                  className={inputBase}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="onsite">On-site</option>
                  <option value="async">Async</option>
                </select>
              </div>
            </>
          )}

          {toStage === 'Offer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#40826D] mb-1 uppercase tracking-wide">
                  Salary
                </label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. $90,000"
                  className={inputBase}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#40826D] mb-1 uppercase tracking-wide">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputBase}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>
          )}

          {(toStage === 'Hired' || (toStage !== 'Screening' && toStage !== 'Interview' && toStage !== 'Offer')) && (
            <p className="text-sm text-gray-500 text-center py-2">
              {toStage === 'Hired'
                ? `Confirm moving ${candidateName} to Hired.`
                : `Confirm moving ${candidateName} to ${toStage}.`}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: 'linear-gradient(90deg, #40826D 0%, #52a98c 100%)',
              boxShadow: '0 2px 8px rgba(64,130,109,0.30)',
            }}
          >
            Confirm Move
          </button>
        </div>
      </div>
    </div>
  )
}
