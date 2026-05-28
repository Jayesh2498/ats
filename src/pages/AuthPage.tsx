/**
 * Login / Signup page — multi-tenant with org name field
 * Route: / (unauthenticated)
 */
import { useState, useEffect, useRef, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Clock, ArrowRight, User, Building2, X, Zap } from 'lucide-react'
import { AtsIcon } from '@/components/AtsIcon'
import { useAuth } from '@/contexts/AuthContext'

type Mode = 'login' | 'signup'
type PendingState = { type: 'pending' | 'rejected'; message: string } | null

// ── Design tokens ──────────────────────────────────────────────
const V = {
  primary:  '#40826D',
  dark:     '#2F6F5E',
  bg:       '#EEF6F3',
  bgLight:  '#D6EDE7',
  border:   '#B0D9CF',
  text:     '#1F2D2A',
  muted:    '#6B7C77',
}
const CLAY_CARD  = '12px 12px 28px rgba(0,0,0,0.08),-8px -8px 20px rgba(255,255,255,0.80)'
const CLAY_BTN   = '4px 4px 10px rgba(0,0,0,0.10),-3px -3px 8px rgba(255,255,255,0.60)'
const CLAY_INSET = 'inset 2px 2px 6px rgba(0,0,0,0.06),inset -2px -2px 6px rgba(255,255,255,0.65)'

const DEMO_EMAIL    = 'demo@talentflow.app'
const DEMO_PASSWORD = 'demo123'

export default function AuthPage() {
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]         = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [pending, setPending]   = useState<PendingState>(null)

  // Used to trigger auto-submit after demo state is set
  const demoRef = useRef(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    await doLogin(email, password)
  }

  async function doLogin(em: string, pw: string) {
    setLoading(true)
    setError(null)
    setPending(null)
    const result = await login(em, pw)
    if (!result.ok) {
      if (result.reason === 'pending' || result.reason === 'rejected') {
        setPending({ type: result.reason, message: result.message })
      } else {
        setError(result.message)
      }
    } else {
      navigate('/dashboard', { replace: true })
    }
    setLoading(false)
    setDemoLoading(false)
  }

  async function handleDemoLogin() {
    setDemoLoading(true)
    setError(null)
    setPending(null)
    // Switch to login mode, fill fields visually, then log in
    setMode('login')
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    demoRef.current = true
  }

  // When demoRef fires + state is settled, actually log in
  useEffect(() => {
    if (!demoRef.current) return
    if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) return
    demoRef.current = false
    doLogin(DEMO_EMAIL, DEMO_PASSWORD)
  }, [email, password]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignupSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    if (!orgName.trim()) {
      setError('Please enter your organization name.')
      return
    }
    setLoading(true)
    setError(null)
    setPending(null)
    const result = await signup(email, password, orgName, fullName)
    if (!result.ok) {
      setError(result.message)
    } else if (result.isAdmin) {
      navigate('/dashboard', { replace: true })
    } else {
      setPending({
        type: 'pending',
        message: 'Your request is pending approval from your organization admin.',
      })
    }
    setLoading(false)
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setPending(null)
    setFullName('')
    setOrgName('')
  }

  // ── Pending / rejected state ────────────────────────────────
  if (pending) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #EEF6F3 0%, #D6EDE7 50%, #EEF6F3 100%)' }}
      >
        <div
          className="w-full max-w-sm text-center space-y-6 rounded-3xl p-10"
          style={{ background: 'hsl(152,14%,96%)', boxShadow: CLAY_CARD, border: '1px solid hsl(150,16%,87%)' }}
        >
          <div
            className="mx-auto flex size-16 items-center justify-center rounded-2xl"
            style={
              pending.type === 'pending'
                ? { background: '#FFFBEB', border: '1px solid #FDE68A' }
                : { background: '#FEF2F2', border: '1px solid #FECACA' }
            }
          >
            {pending.type === 'pending' ? (
              <Clock className="size-7 text-amber-500" />
            ) : (
              <X className="size-7 text-red-500" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black" style={{ color: V.text }}>
              {pending.type === 'pending' ? 'Awaiting Approval' : 'Access Denied'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: V.muted }}>
              {pending.message}
            </p>
          </div>
          {pending.type === 'pending' && (
            <div
              className="rounded-2xl p-4 text-left text-xs space-y-1"
              style={{ background: 'rgba(255,251,235,0.8)', border: '1px solid #FDE68A' }}
            >
              <p className="font-bold text-amber-800">What happens next?</p>
              <p className="text-amber-700">Your organization admin will review and approve your request. You'll be able to log in once approved.</p>
            </div>
          )}
          <button
            onClick={() => setPending(null)}
            className="text-sm font-semibold hover:underline transition-colors"
            style={{ color: V.primary }}
          >
            ← Back to login
          </button>
        </div>
      </div>
    )
  }

  const isLoginMode = mode === 'login'

  // ── Auth form ───────────────────────────────────────────────
  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'linear-gradient(135deg, #EEF6F3 0%, #D6EDE7 40%, hsl(150,20%,88%) 100%)' }}
    >
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background clay blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 size-96 rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle,#B0D9CF,transparent 70%)', filter: 'blur(40px)' }}
          />
          <div
            className="absolute bottom-0 right-0 size-80 rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle,#83C0B3,transparent 70%)', filter: 'blur(50px)' }}
          />
          <div
            className="absolute top-1/2 left-1/3 size-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle,#40826D,transparent 70%)', filter: 'blur(60px)' }}
          />
        </div>

        <div className="relative z-10 max-w-md space-y-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 items-center justify-center rounded-2xl"
              style={{
                background: `linear-gradient(135deg,${V.primary},${V.dark})`,
                boxShadow: '6px 6px 16px rgba(64,130,109,0.30),-4px -4px 10px rgba(255,255,255,0.5)',
              }}
            >
              <AtsIcon size={24} color="white" />
            </div>
            <div>
              <p className="text-xl font-extrabold" style={{ color: V.text }}>ATS</p>
              <p className="text-xs font-semibold" style={{ color: V.muted }}>AI-Native Recruiting</p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-5xl font-black leading-[1.08]" style={{ color: V.text }}>
              Hire smarter,<br />
              <span style={{ color: V.primary }}>move faster.</span>
            </h1>
            <p className="text-base leading-relaxed" style={{ color: V.muted }}>
              Your AI-powered applicant tracking system. From job posting to signed offer — all in one place.
            </p>
          </div>

          {/* Multi-tenant callout */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(176,217,207,0.6)',
              backdropFilter: 'blur(8px)',
              boxShadow: '4px 4px 12px rgba(0,0,0,0.05),-3px -3px 8px rgba(255,255,255,0.7)',
            }}
          >
            <div className="flex items-center gap-2">
              <Building2 className="size-4" style={{ color: V.primary }} />
              <p className="text-sm font-bold" style={{ color: V.text }}>Multi-Organization Support</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: V.muted }}>
              Each organization gets its own isolated ATS environment. Create a new org or join an existing one.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🤖', title: 'AI Scoring',      desc: 'Auto-rank every applicant' },
              { icon: '📋', title: 'Kanban Pipeline', desc: 'Visual stage management'   },
              { icon: '✉️', title: 'Email Templates', desc: 'One-click outreach'        },
              { icon: '📅', title: 'Interview Sync',  desc: 'Calendar & scheduling'     },
            ].map(f => (
              <div
                key={f.title}
                className="rounded-2xl p-4 space-y-1"
                style={{
                  background: 'rgba(255,255,255,0.55)',
                  border: '1px solid rgba(176,217,207,0.6)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '4px 4px 12px rgba(0,0,0,0.05),-3px -3px 8px rgba(255,255,255,0.7)',
                }}
              >
                <span className="text-xl">{f.icon}</span>
                <p className="text-sm font-bold" style={{ color: V.text }}>{f.title}</p>
                <p className="text-xs" style={{ color: V.muted }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">

          {/* ── Demo login banner ── */}
          <div
            className="mb-4 rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(64,130,109,0.12), rgba(64,130,109,0.06))',
              border: `1px solid ${V.border}`,
              boxShadow: '0 2px 8px rgba(64,130,109,0.08)',
            }}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})` }}
            >
              <Zap className="size-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: V.text }}>Try the live demo</p>
              <p className="text-[11px] truncate" style={{ color: V.muted }}>
                TalentFlow org · Admin account · Full access
              </p>
            </div>
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-all disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg,${V.primary},${V.dark})`,
                boxShadow: CLAY_BTN,
              }}
              onMouseEnter={e => { if (!demoLoading) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = '' }}
            >
              {demoLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Zap className="size-3.5" />
                  Demo login
                </>
              )}
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: V.border }} />
            <span className="text-[11px] font-semibold" style={{ color: V.muted }}>or continue manually</span>
            <div className="flex-1 h-px" style={{ background: V.border }} />
          </div>

          {/* ── Main card ── */}
          <div
            className="rounded-3xl p-8"
            style={{
              background: 'hsl(152,14%,96%)',
              boxShadow: CLAY_CARD,
              border: '1px solid hsl(150,16%,87%)',
            }}
          >
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div
                className="flex size-9 items-center justify-center rounded-xl"
                style={{ background: `linear-gradient(135deg,${V.primary},${V.dark})` }}
              >
                <AtsIcon size={16} color="white" />
              </div>
              <span className="text-base font-extrabold" style={{ color: V.text }}>ATS</span>
            </div>

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-black" style={{ color: V.text }}>
                {isLoginMode ? 'Welcome back' : 'Get started'}
              </h2>
              <p className="mt-1 text-sm" style={{ color: V.muted }}>
                {isLoginMode
                  ? 'Sign in to your organization workspace.'
                  : 'Create or join an organization to begin.'}
              </p>
            </div>

            {/* Mode toggle */}
            <div
              className="flex rounded-2xl p-1 mb-6"
              style={{ background: 'hsl(150,14%,91%)', boxShadow: CLAY_INSET }}
            >
              {(['login', 'signup'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                  style={
                    mode === m
                      ? {
                          background: `linear-gradient(135deg,${V.primary},${V.dark})`,
                          color: '#fff',
                          boxShadow: CLAY_BTN,
                        }
                      : { color: V.muted }
                  }
                >
                  {m === 'login' ? 'Log in' : 'Sign up'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={isLoginMode ? handleSubmit : handleSignupSubmit} className="space-y-4">

              {/* Full Name — signup only */}
              {!isLoginMode && (
                <FieldInput
                  label="Your Name"
                  icon={<User className="size-4" style={{ color: V.muted }} />}
                  type="text"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="e.g. Mira Patel"
                  V={V}
                  CLAY_INSET={CLAY_INSET}
                />
              )}

              {/* Organization Name — signup only */}
              {!isLoginMode && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: V.muted }}>
                    Organization Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4" style={{ color: V.muted }} />
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      required
                      className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition"
                      style={{
                        background: 'hsl(150,14%,91%)',
                        borderColor: 'hsl(150,16%,85%)',
                        color: V.text,
                        boxShadow: CLAY_INSET,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = V.border
                        e.currentTarget.style.boxShadow = `${CLAY_INSET}, 0 0 0 3px rgba(64,130,109,0.08)`
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'hsl(150,16%,85%)'
                        e.currentTarget.style.boxShadow = CLAY_INSET
                      }}
                    />
                  </div>
                  <p className="text-[11px]" style={{ color: V.muted }}>
                    New org → you become admin. Existing org → pending approval.
                  </p>
                </div>
              )}

              {/* Email */}
              <FieldInput
                label="Email"
                icon={<Mail className="size-4" style={{ color: V.muted }} />}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
                required
                V={V}
                CLAY_INSET={CLAY_INSET}
              />

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: V.muted }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4" style={{ color: V.muted }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none transition"
                    style={{
                      background: 'hsl(150,14%,91%)',
                      borderColor: 'hsl(150,16%,85%)',
                      color: V.text,
                      boxShadow: CLAY_INSET,
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = V.border
                      e.currentTarget.style.boxShadow = `${CLAY_INSET}, 0 0 0 3px rgba(64,130,109,0.08)`
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'hsl(150,16%,85%)'
                      e.currentTarget.style.boxShadow = CLAY_INSET
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: V.muted }}
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-2.5 rounded-xl border p-3"
                  style={{ borderColor: '#FECACA', background: '#FEF2F2' }}
                >
                  <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || demoLoading || !email || !password || (!isLoginMode && !orgName)}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{
                  background: `linear-gradient(135deg,${V.primary},${V.dark})`,
                  boxShadow: CLAY_BTN,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    {isLoginMode ? 'Log in' : 'Create account'}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="mt-5 text-center text-xs" style={{ color: 'hsl(150,10%,60%)' }}>
              {isLoginMode
                ? 'New here? Switch to Sign up above.'
                : 'By signing up you agree to our terms of service.'}
            </p>
          </div>

          {/* Bottom badge */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="size-1.5 rounded-full animate-pulse" style={{ background: V.primary }} />
            <p className="text-xs font-medium" style={{ color: V.muted }}>
              Powered by TalentFlow · Multi-tenant · Enterprise-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helper field component ─────────────────────────────────────
function FieldInput({
  label, icon, type, value, onChange, placeholder, required, V, CLAY_INSET,
}: {
  label: string
  icon: React.ReactNode
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  required?: boolean
  V: Record<string, string>
  CLAY_INSET: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: V.muted }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition"
          style={{
            background: 'hsl(150,14%,91%)',
            borderColor: 'hsl(150,16%,85%)',
            color: V.text,
            boxShadow: CLAY_INSET,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = V.border
            e.currentTarget.style.boxShadow = `${CLAY_INSET}, 0 0 0 3px rgba(64,130,109,0.08)`
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'hsl(150,16%,85%)'
            e.currentTarget.style.boxShadow = CLAY_INSET
          }}
        />
      </div>
    </div>
  )
}
