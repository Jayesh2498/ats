/**
 * Workflows — Coming Soon (viridian theme)
 * Route: /workflows
 */
import { Zap, Bell, ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { toast } from 'sonner'

const UPCOMING_FEATURES = [
  { icon: '⚡', title: 'Trigger-Based Automations', desc: 'Automatically send emails, move candidates, or notify your team when specific pipeline events happen.' },
  { icon: '✉️', title: 'Email Sequence Builder', desc: 'Create multi-step email sequences for interview scheduling, follow-ups, and offer workflows.' },
  { icon: '🤖', title: 'AI-Powered Actions', desc: 'Let AI score resumes, suggest next steps, and auto-draft personalised outreach for every candidate.' },
  { icon: '📅', title: 'Calendar Sync', desc: 'Sync interview scheduling with Google Calendar and Outlook — no more back-and-forth.' },
  { icon: '🔔', title: 'Slack & Teams Alerts', desc: "Get real-time hiring updates in your team's Slack or Teams channels." },
  { icon: '📊', title: 'Workflow Analytics', desc: 'Track automation run rates, success percentages, and time saved per workflow.' },
]

const CLAY = '6px 6px 14px rgba(0,0,0,0.07),-4px -4px 10px rgba(255,255,255,0.70)'

export default function Workflows() {
  return (
    <AppShell>
      <div className="flex h-full items-start justify-center overflow-y-auto px-8 py-16">
        <div className="w-full max-w-2xl">

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl mb-6"
              style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)', boxShadow: '6px 6px 16px rgba(64,130,109,0.30),-4px -4px 10px rgba(255,255,255,0.5)' }}>
              <Zap className="size-8 text-white" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-4"
              style={{ borderColor: '#B0D9CF', background: '#EEF6F3' }}>
              <div className="size-2 rounded-full animate-pulse" style={{ background: '#40826D' }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2F6F5E' }}>Coming Soon</p>
            </div>
            <h1 className="text-4xl font-black text-foreground mb-3">Workflow Automation</h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-lg mx-auto">
              Automate your entire hiring pipeline. From resume screening to offer letters — let SuperAGI do the heavy lifting.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {UPCOMING_FEATURES.map((f, i) => (
              <div key={i} className="rounded-2xl border p-5 space-y-2 transition-all"
                style={{
                  background: 'hsl(152,14%,96%)',
                  borderColor: 'hsl(150,16%,87%)',
                  boxShadow: CLAY,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#B0D9CF'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(150,16%,87%)'; (e.currentTarget as HTMLElement).style.transform = '' }}
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="font-semibold text-foreground text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Notify CTA */}
          <div className="rounded-2xl border p-6 flex items-center gap-5"
            style={{ borderColor: '#B0D9CF', background: '#EEF6F3', boxShadow: CLAY }}>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)', boxShadow: '4px 4px 10px rgba(64,130,109,0.25)' }}>
              <Bell className="size-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ color: '#1F2D2A' }}>Get Early Access</p>
              <p className="text-sm mt-0.5" style={{ color: '#6B7C77' }}>
                Workflow Automation is in active development. You'll be notified as soon as it's live.
              </p>
            </div>
            <button
              className="flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-bold text-white shrink-0 transition-all"
              style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)', boxShadow: '4px 4px 10px rgba(64,130,109,0.25),-3px -3px 8px rgba(255,255,255,0.55)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 14px rgba(64,130,109,0.30),-3px -3px 8px rgba(255,255,255,0.5)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 10px rgba(64,130,109,0.25),-3px -3px 8px rgba(255,255,255,0.55)' }}
              onClick={() => toast.success("You're on the list! We'll notify you when Workflows goes live.")}
            >
              Notify Me <ArrowRight className="size-3.5" />
            </button>
          </div>

        </div>
      </div>
    </AppShell>
  )
}
