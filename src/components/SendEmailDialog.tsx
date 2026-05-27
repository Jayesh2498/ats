import { useState, useEffect, useRef } from 'react'
import { Mail, X, Send, ChevronDown } from 'lucide-react'
import { mockDb, DEMO_ORG_ID } from '@/lib/mockDb'
import { loadSession } from '@/lib/auth'
import { toast } from 'sonner'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

interface Props {
  open: boolean
  onClose: () => void
  candidate?: { name: string; email: string }
  job?: { title?: string }
}

export default function SendEmailDialog({ open, onClose, candidate }: Props) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setSubject('')
    setBody('')
    fetchTemplates()
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTemplateDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function fetchTemplates() {
    const orgId = loadSession()?.org_id ?? DEMO_ORG_ID
    setTemplates(mockDb.getEmailTemplates(orgId))
  }

  function applyTemplate(template: EmailTemplate) {
    setSubject(template.subject)
    setBody(template.body)
    setTemplateDropdownOpen(false)
  }

  async function handleSend() {
    if (!candidate?.email) {
      toast.error('No recipient email address')
      return
    }
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body are required')
      return
    }
    setSending(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success(`Email sent to ${candidate.name}`)
    setSending(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1.5px solid rgba(64,130,109,0.18)',
          boxShadow: '0 8px 32px 0 rgba(64,130,109,0.18), 0 2px 8px 0 rgba(0,0,0,0.10)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, #40826D 0%, #52a98c 100%)' }}
        >
          <div className="flex items-center gap-2">
            <Mail className="text-white" size={20} />
            <span className="text-white font-semibold text-lg">Send Email</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors rounded-full p-1 hover:bg-white/20"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* To field */}
          <div>
            <label className="block text-xs font-semibold text-[#40826D] mb-1 uppercase tracking-wide">
              To
            </label>
            <div
              className="w-full px-3 py-2 rounded-xl text-sm text-gray-700 border"
              style={{
                background: 'rgba(64,130,109,0.06)',
                borderColor: 'rgba(64,130,109,0.25)',
              }}
            >
              {candidate ? (
                <span>
                  <span className="font-medium text-gray-800">{candidate.name}</span>
                  <span className="text-gray-500 ml-2">&lt;{candidate.email}&gt;</span>
                </span>
              ) : (
                <span className="text-gray-400 italic">No recipient selected</span>
              )}
            </div>
          </div>

          {/* Template picker */}
          {templates.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setTemplateDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border transition-colors"
                style={{
                  color: '#40826D',
                  borderColor: 'rgba(64,130,109,0.35)',
                  background: 'rgba(64,130,109,0.07)',
                }}
              >
                Use Template
                <ChevronDown
                  size={15}
                  className={`transition-transform ${templateDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {templateDropdownOpen && (
                <div
                  className="absolute left-0 mt-1 w-64 rounded-xl shadow-lg z-10 overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.97)',
                    border: '1.5px solid rgba(64,130,109,0.18)',
                    boxShadow: '0 4px 20px rgba(64,130,109,0.15)',
                  }}
                >
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#40826D]/10 transition-colors"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-[#40826D] mb-1 uppercase tracking-wide">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject…"
              className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 border outline-none focus:ring-2 transition"
              style={{
                background: 'rgba(64,130,109,0.04)',
                borderColor: 'rgba(64,130,109,0.25)',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = '#40826D')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = 'rgba(64,130,109,0.25)')
              }
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-[#40826D] mb-1 uppercase tracking-wide">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here…"
              rows={5}
              className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 border outline-none resize-y transition"
              style={{
                minHeight: '120px',
                background: 'rgba(64,130,109,0.04)',
                borderColor: 'rgba(64,130,109,0.25)',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = '#40826D')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = 'rgba(64,130,109,0.25)')
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: sending
                ? 'rgba(64,130,109,0.6)'
                : 'linear-gradient(90deg, #40826D 0%, #52a98c 100%)',
              boxShadow: sending ? 'none' : '0 2px 8px rgba(64,130,109,0.30)',
            }}
          >
            <Send size={15} />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
