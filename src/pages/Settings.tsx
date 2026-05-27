/**
 * Settings — tabbed hub: General, Email Integration, Pipeline, Users
 * Route: /settings
 */
import { useState, useEffect } from 'react'

import { Link } from 'react-router-dom'
import {
  Users, RotateCcw, ChevronRight,
  ShieldCheck, Settings as SettingsIcon, Palette,
  Mail, CheckCircle2, Wifi, WifiOff, Eye, EyeOff,
  AlertCircle, Loader2, Unplug,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { useAuth } from '@/contexts/AuthContext'
import { useEmailSettings } from '@/hooks/useEmailSettings'
import type { EmailProvider } from '@/hooks/useEmailSettings'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Tabs ──────────────────────────────────────────────────────

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'email',   label: 'Email Integration' },
]

// ── Settings sections for General tab ─────────────────────────

const SETTINGS_SECTIONS = [
  {
    id: 'users',
    icon: Users,
    iconBg: 'bg-viridian-100 text-viridian-600',
    title: 'User Approvals',
    description: 'Review and manage access requests. Approve or reject pending team members.',
    href: '/admin/users',
    badge: null,
    adminOnly: true,
  },
  {
    id: 'auth-reset',
    icon: RotateCcw,
    iconBg: 'bg-red-100 text-red-600',
    title: 'Auth Reset',
    description: 'Developer tool — clear all user accounts from the system. Use with caution.',
    href: '/dev/auth-reset',
    badge: 'Dev Only',
    adminOnly: true,
  },
]

// ── Email providers ────────────────────────────────────────────

const PROVIDERS: { id: EmailProvider; label: string; icon: string; desc: string }[] = [
  { id: 'gmail',   label: 'Gmail',        icon: '📧', desc: 'Connect via Google OAuth or App Password' },
  { id: 'outlook', label: 'Outlook / 365',icon: '📨', desc: 'Microsoft email via SMTP or OAuth' },
  { id: 'smtp',    label: 'Custom SMTP',  icon: '🔧', desc: 'Any SMTP server (SendGrid, Mailgun, etc.)' },
]

// ── Main component ─────────────────────────────────────────────

export default function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [activeTab, setActiveTab] = useState('email')

  return (
    <AppShell>
      <div className="px-8 py-7 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 uppercase tracking-widest font-bold">
            <SettingsIcon className="size-3.5" />
            Settings
          </div>
          <h1 className="text-3xl font-black text-foreground">Settings & Admin</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Manage your ATS configuration, email integration, and team access.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b mb-7">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-viridian-300 text-viridian-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        {activeTab === 'general' && <GeneralTab isAdmin={isAdmin} />}
        {activeTab === 'email'   && <EmailTab />}

        {/* Footer */}
        <div className="mt-10 rounded-2xl border bg-muted/30 p-5 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-viridian-500 to-viridian-700">
            <Palette className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">ATS</p>
            <p className="text-xs text-muted-foreground">AI-Native Recruiting Platform · v1.0</p>
          </div>
          {isAdmin && (
            <span className="flex items-center gap-1.5 rounded-full bg-viridian-100 px-3 py-1 text-xs font-bold text-viridian-600">
              <ShieldCheck className="size-3" /> Admin
            </span>
          )}
        </div>
      </div>
    </AppShell>
  )
}

// ── General tab ───────────────────────────────────────────────

function GeneralTab({ isAdmin }: { isAdmin: boolean }) {
  const visible = SETTINGS_SECTIONS.filter(s => !s.adminOnly || isAdmin)
  return (
    <div className="space-y-3">
      {visible.map(section => (
        <SettingsCard key={section.id} section={section} />
      ))}
    </div>
  )
}

function SettingsCard({ section }: { section: typeof SETTINGS_SECTIONS[number] }) {
  const Icon = section.icon
  const isComingSoon = section.badge === 'Coming Soon'

  if (isComingSoon) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border bg-card p-5 opacity-60 cursor-not-allowed">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', section.iconBg)}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-foreground">{section.title}</p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
              {section.badge}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </div>
      </div>
    )
  }

  return (
    <Link
      to={section.href}
      className="flex items-center gap-4 rounded-2xl border bg-card p-5 hover:border-viridian-300 hover:bg-viridian-50/30 transition-colors group"
    >
      <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', section.iconBg)}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-foreground">{section.title}</p>
          {section.badge && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
              {section.badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground group-hover:text-viridian-600 transition-colors shrink-0" />
    </Link>
  )
}

// ── Email integration tab ─────────────────────────────────────

function EmailTab() {
  const { settings, loading, saving, testAndConnect, disconnect } = useEmailSettings()

  const [provider, setProvider] = useState<EmailProvider>('smtp')
  const [fromName, setFromName]   = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [smtpHost, setSmtpHost]   = useState('')
  const [smtpPort, setSmtpPort]   = useState('587')
  const [smtpUser, setSmtpUser]   = useState('')
  const [smtpPass, setSmtpPass]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [testing, setTesting]     = useState(false)
  const [initialised, setInitialised] = useState(false)

  // Populate form from DB once loaded
  if (!loading && !initialised && settings) {
    setProvider(settings.provider ?? 'smtp')
    setFromName(settings.from_name ?? '')
    setFromEmail(settings.from_email ?? '')
    setSmtpHost(settings.smtp_host ?? '')
    setSmtpPort(String(settings.smtp_port ?? 587))
    setSmtpUser(settings.smtp_user ?? '')
    setSmtpPass(settings.smtp_pass ?? '')
    setInitialised(true)
  }

  async function handleConnect() {
    setTesting(true)
    const { ok, message } = await testAndConnect({
      provider,
      from_name:  fromName,
      from_email: fromEmail,
      smtp_host:  smtpHost || null,
      smtp_port:  parseInt(smtpPort) || 587,
      smtp_user:  smtpUser || null,
      smtp_pass:  smtpPass || null,
    })
    setTesting(false)
    if (ok) toast.success(message)
    else    toast.error(message)
  }

  async function handleDisconnect() {
    await disconnect()
    toast.success('Email account disconnected.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-viridian-600" />
      </div>
    )
  }

  const isConnected = settings?.connected

  return (
    <div className="space-y-6">

      {/* Status banner */}
      <div className={cn(
        'flex items-center gap-3 rounded-2xl border p-4',
        isConnected ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50',
      )}>
        <div className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl',
          isConnected ? 'bg-emerald-100' : 'bg-amber-100',
        )}>
          {isConnected ? <Wifi className="size-4 text-emerald-600" /> : <WifiOff className="size-4 text-amber-600" />}
        </div>
        <div className="flex-1">
          <p className={cn('text-sm font-bold', isConnected ? 'text-emerald-800' : 'text-amber-800')}>
            {isConnected ? `Connected — ${settings?.from_name} <${settings?.from_email}>` : 'No email account connected'}
          </p>
          <p className={cn('text-xs mt-0.5', isConnected ? 'text-emerald-600' : 'text-amber-600')}>
            {isConnected
              ? `Provider: ${PROVIDERS.find(p => p.id === settings?.provider)?.label ?? settings?.provider}`
              : 'Connect an email to send templates directly from the platform'}
          </p>
        </div>
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Unplug className="size-3.5" /> Disconnect
          </button>
        )}
      </div>

      {/* Provider picker */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Provider</label>
        <div className="grid grid-cols-3 gap-3">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={cn(
                'flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all',
                provider === p.id
                  ? 'border-viridian-300 bg-viridian-50 ring-2 ring-viridian-300'
                  : 'border-border bg-card hover:border-viridian-300 hover:bg-viridian-50/30',
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xl">{p.icon}</span>
                {provider === p.id && <CheckCircle2 className="size-4 text-viridian-600" />}
              </div>
              <p className="text-sm font-bold text-foreground">{p.label}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sender identity */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <p className="text-sm font-bold text-foreground">Sender Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">From Name</label>
            <input
              value={fromName}
              onChange={e => setFromName(e.target.value)}
              placeholder="e.g. Sarah — Talent at Acme"
              className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-viridian-300"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">From Email</label>
            <input
              type="email"
              value={fromEmail}
              onChange={e => setFromEmail(e.target.value)}
              placeholder="recruiter@company.com"
              className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-viridian-300"
            />
          </div>
        </div>
      </div>

      {/* SMTP config (only for smtp provider) */}
      {provider === 'smtp' && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">SMTP Configuration</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">SMTP Host</label>
              <input
                value={smtpHost}
                onChange={e => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-viridian-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Port</label>
              <input
                value={smtpPort}
                onChange={e => setSmtpPort(e.target.value)}
                placeholder="587"
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-viridian-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Username</label>
              <input
                value={smtpUser}
                onChange={e => setSmtpUser(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-viridian-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Password / App Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={smtpPass}
                  onChange={e => setSmtpPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-viridian-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
            <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              For Gmail, use an <strong>App Password</strong> (not your regular password). Go to Google Account → Security → 2-Step Verification → App Passwords.
            </p>
          </div>
        </div>
      )}

      {/* OAuth note for gmail/outlook */}
      {(provider === 'gmail' || provider === 'outlook') && (
        <div className="rounded-2xl border border-viridian-300 bg-viridian-50 p-4 flex items-start gap-3">
          <Mail className="size-4 text-viridian-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-viridian-600">
              {provider === 'gmail' ? 'Gmail' : 'Outlook'} — use SMTP with App Password
            </p>
            <p className="text-xs text-viridian-600 mt-1 leading-relaxed">
              Enter your email above and use an App Password in the SMTP fields below (switch to Custom SMTP), 
              or fill in the From Name & Email above and we'll use your connected SMTP server to deliver emails.
            </p>
          </div>
        </div>
      )}

      {/* Connect button */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Once connected, you can send email templates directly from candidate profiles and the pipeline.
        </p>
        <button
          onClick={handleConnect}
          disabled={testing || saving}
          className="flex items-center gap-2 rounded-[14px] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all"
          style={{ background: 'linear-gradient(135deg,#40826D,#2F6F5E)', boxShadow: '4px 4px 10px rgba(64,130,109,0.25),-3px -3px 8px rgba(255,255,255,0.55)' }}
        >
          {(testing || saving) ? (
            <><Loader2 className="size-4 animate-spin" /> Connecting…</>
          ) : (
            <><CheckCircle2 className="size-4" /> {isConnected ? 'Update Connection' : 'Connect Email'}</>
          )}
        </button>
      </div>

      {/* Email send history */}
      <EmailSendHistory />
    </div>
  )
}

// ── Email send history ────────────────────────────────────────

interface EmailSendRow {
  id: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  template_name: string | null
  status: string
  sent_at: string
}

function EmailSendHistory() {
  const { user } = useAuth()
  const [rows, setRows] = useState<EmailSendRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    import('@/lib/supabase').then(({ supabase }) => {
      supabase
        .from('email_sends')
        .select('id,recipient_email,recipient_name,subject,template_name,status,sent_at')
        .eq('workspace_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          setRows((data ?? []) as EmailSendRow[])
          setLoading(false)
        })
    })
  }, [user?.id])

  if (loading) return null
  if (rows.length === 0) return (
    <div className="rounded-2xl border bg-muted/20 p-6 text-center">
      <Mail className="size-8 mx-auto text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">No emails sent yet.</p>
      <p className="text-xs text-muted-foreground mt-1">Send your first email from a candidate profile or the pipeline.</p>
    </div>
  )

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Emails Sent</p>
      <div className="rounded-2xl border overflow-hidden">
        {rows.map((row, i) => (
          <div key={row.id} className={cn('flex items-center gap-4 px-4 py-3', i < rows.length - 1 && 'border-b')}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-viridian-100">
              <Mail className="size-3.5 text-viridian-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{row.subject}</p>
              <p className="text-xs text-muted-foreground">{row.recipient_name ? `${row.recipient_name} · ` : ''}{row.recipient_email}</p>
            </div>
            {row.template_name && (
              <span className="rounded-full bg-viridian-100 px-2 py-0.5 text-[10px] font-bold text-viridian-600 shrink-0">
                {row.template_name}
              </span>
            )}
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0',
              row.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600',
            )}>
              {row.status}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {new Date(row.sent_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
