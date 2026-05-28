/**
 * ATS — Marketing Landing Page
 * Route: /
 */
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Zap, Mail, Gift, ChevronRight, Check, ArrowRight,
  Users, BarChart3, Clock, Menu, X

} from 'lucide-react'
import { AtsIcon } from '@/components/AtsIcon'
import { cn } from '@/lib/utils'
import { MOCK_APPLICATIONS, MOCK_STAGES } from '@/lib/mock-data'
import { computeAiScore } from '@/lib/aiEngine'
import { AiScoreBadge } from '@/components/ai/AiScoreBadge'
import { TopCandidateBadge } from '@/components/ai/TopCandidateBadge'
import { getAvatarColor, getInitials } from '@/types/ats'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// ── Pre-score demo candidates ────────────────────────────────
const DEMO_SCORED = MOCK_APPLICATIONS.map(app => ({
  app,
  result: computeAiScore(app.candidate!, app.job?.title ?? '', app.current_stage?.name),
})).sort((a, b) => b.result.total - a.result.total)

const TOP_SCORE = Math.max(...DEMO_SCORED.map(d => d.result.total))

// ── Navbar ───────────────────────────────────────────────────
function Navbar({ onScrollToDemo }: { onScrollToDemo: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-9 items-center justify-center rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #40826D, #2F6F5E)', boxShadow: '0 4px 14px rgba(64,130,109,0.35)' }}>
            <AtsIcon size={18} color="white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-900">
            TalentFlow <span style={{ color: '#40826D' }}>ATS</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {[['Features', '#features'], ['How it works', '#how-it-works']].map(([label, href]) => (

            <a key={label} href={href} className="text-sm font-medium text-gray-600 transition-colors hover:text-violet-700">
              {label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onScrollToDemo}
            className="text-sm font-medium text-gray-700 hover:text-violet-700 transition-colors"
          >
            See Demo
          </button>
          <Link
            to="/app"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 transition-all hover:shadow-violet-300/70 hover:scale-105"
          >
            Open App <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-1" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-6 py-4 space-y-3">
          {[['Features', '#features'], ['How it works', '#how-it-works']].map(([label, href]) => (

            <a key={label} href={href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-700 py-1">{label}</a>
          ))}
          <Link to="/app" className="block rounded-full bg-gradient-to-r from-violet-600 to-pink-500 px-5 py-2.5 text-center text-sm font-semibold text-white">
            Open App
          </Link>
        </div>
      )}
    </nav>
  )
}

// ── Hero ─────────────────────────────────────────────────────
function HeroSection({ onScrollToDemo }: { onScrollToDemo: () => void }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] animate-blob rounded-full bg-violet-200/50 blur-3xl" />
        <div className="absolute -top-10 right-0 h-[400px] w-[400px] animate-blob rounded-full bg-pink-200/50 blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/2 h-[350px] w-[350px] animate-blob rounded-full bg-amber-100/60 blur-3xl" style={{ animationDelay: '4s' }} />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(139 92 246 / 0.06) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Pill badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700">
            <Sparkles className="size-3.5" />
            AI-powered applicant tracking · Now in beta
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up max-w-3xl text-5xl font-black tracking-tight text-gray-900 md:text-7xl" style={{ animationDelay: '0.1s' }}>
            Hire smarter,{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-amber-400 bg-clip-text text-transparent">
                faster
              </span>
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="animate-fade-up max-w-xl text-xl text-gray-500 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            SuperHire combines AI scoring, workflow automation, and beautiful candidate management — so your team focuses on people, not process.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up flex flex-col sm:flex-row items-center gap-4" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={onScrollToDemo}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-violet-500 to-pink-500 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-violet-300/50 transition-all hover:shadow-violet-400/60 hover:scale-105 animate-pulse-glow"
            >
              See Demo
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              to="/app"
              className="flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-8 py-3.5 text-base font-bold text-gray-800 transition-all hover:border-violet-300 hover:text-violet-700 hover:shadow-md"
            >
              Open App
            </Link>
          </div>

          {/* Social proof */}
          <p className="animate-fade-up text-sm text-gray-400" style={{ animationDelay: '0.4s' }}>
            No credit card required · Free forever plan available
          </p>

          {/* Floating mockup */}
          <div className="animate-float-slow mt-8 w-full max-w-2xl" style={{ animationDelay: '0.5s' }}>
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroMockup() {
  return (
    <div className="relative mx-auto rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-violet-200/40 overflow-hidden">
      {/* Fake browser chrome */}
      <div className="flex items-center gap-1.5 border-b bg-gray-50 px-4 py-3">
        <div className="size-3 rounded-full bg-red-400" />
        <div className="size-3 rounded-full bg-amber-400" />
        <div className="size-3 rounded-full bg-emerald-400" />
        <div className="mx-3 flex-1 rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-400 text-center">
          app.superhire.io/pipeline
        </div>
      </div>

      {/* Mini pipeline */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Senior Frontend Engineer</p>
            <p className="text-xs text-gray-400">3 candidates · Remote · Engineering</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-violet-600 font-semibold bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1">
            <Sparkles className="size-3" /> AI Active
          </div>
        </div>

        {DEMO_SCORED.map(({ app, result }, i) => {
          const c = app.candidate!
          const av = getAvatarColor(c.full_name)
          const stage = MOCK_STAGES.find(s => s.id === app.current_stage_id)
          const isTop = result.total === TOP_SCORE

          return (
            <div key={app.id} className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
              isTop ? 'border-violet-200 bg-violet-50/40' : 'border-gray-100 bg-gray-50/50',
            )}>
              <div className={cn('flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                i === 0 ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500',
              )}>
                {i + 1}
              </div>
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className={cn('text-xs font-bold', av.bg, av.text)}>
                  {getInitials(c.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-900 truncate">{c.full_name}</span>
                  {isTop && <TopCandidateBadge />}
                  {stage && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">{stage.name}</span>}
                </div>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{c.email}</p>
              </div>
              <AiScoreBadge score={result.total} grade={result.grade} size="sm" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Stats ─────────────────────────────────────────────────────
const STATS = [
  { icon: '⚡', value: '10×', label: 'Faster hiring decisions', color: 'text-violet-600' },
  { icon: '🏢', value: '500+', label: 'Companies onboarded', color: 'text-pink-600' },
  { icon: '🎯', value: '98%', label: 'Offer acceptance rate', color: 'text-amber-600' },
  { icon: '⏰', value: '2hrs', label: 'Saved per recruiter daily', color: 'text-emerald-600' },
]

function StatsBar() {
  return (
    <section className="border-y bg-gradient-to-r from-violet-50 via-pink-50 to-amber-50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl">{stat.icon}</span>
              <span className={cn('text-4xl font-black tracking-tight', stat.color)}>{stat.value}</span>
              <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How it works ─────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    icon: '📋',
    title: 'Post your role',
    desc: 'Create a job posting in seconds. SuperHire automatically structures your pipeline stages and generates smart screening criteria.',
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    num: '02',
    icon: '🤖',
    title: 'AI ranks applicants',
    desc: 'Our AI engine scores every candidate on skills match, experience, and resume quality — giving you an instant ranked shortlist.',
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
  {
    num: '03',
    icon: '🚀',
    title: 'Hire with confidence',
    desc: 'Move candidates through your pipeline, send templated emails, generate offer letters, and close roles faster than ever.',
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <span className="rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700">
            How it works
          </span>
          <h2 className="mt-4 text-4xl font-black text-gray-900 md:text-5xl">
            From posting to hired<br />
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">in three steps</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            SuperHire removes the busywork so your team spends time on what matters — finding great people.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connector line */}
          <div className="absolute top-12 left-1/4 right-1/4 hidden h-0.5 bg-gradient-to-r from-violet-200 via-pink-200 to-amber-200 md:block" />

          {STEPS.map((step, i) => (
            <div key={i} className={cn('relative rounded-2xl border p-8 transition-all hover:-translate-y-1 hover:shadow-lg', step.bg, step.border)}>
              <div className={cn('mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-md', step.color)}>
                {step.icon}
              </div>
              <div className="absolute top-6 right-6 text-5xl font-black text-gray-100 select-none">{step.num}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Sparkles className="size-6" />,
    title: 'AI Scoring Engine',
    desc: 'Every candidate gets an instant fit score (A–D grade) based on skills, experience, and resume quality. Re-score anytime.',
    bullets: ['Skills match analysis', 'Experience scoring', 'Grade badges (A/B/C/D)', 'Top candidate crown 👑'],
    gradient: 'from-violet-500 to-indigo-500',
    light: 'bg-violet-50',
    tag: 'Smart ranking',
  },
  {
    icon: <Zap className="size-6" />,
    title: 'Workflow Automation',
    desc: 'Build no-code automations that trigger on stage moves, scores, or time delays. Stop doing the same thing twice.',
    bullets: ['Drag-and-drop builder', 'Stage-based triggers', 'Email + status actions', 'Full execution logs'],
    gradient: 'from-pink-500 to-rose-500',
    light: 'bg-pink-50',
    tag: 'No-code',
  },
  {
    icon: <Mail className="size-6" />,
    title: 'Email Templates',
    desc: 'A library of recruiter-tested email templates with smart variable interpolation. Send the right message every time.',
    bullets: ['5 starter templates', '{{variable}} system', 'Live preview pane', 'Category filtering'],
    gradient: 'from-amber-400 to-orange-500',
    light: 'bg-amber-50',
    tag: 'Personalized',
  },
  {
    icon: <Gift className="size-6" />,
    title: 'Offer Management',
    desc: 'Generate shareable offer links candidates can accept or decline online — no email back-and-forth needed.',
    bullets: ['Token-secured links', 'Accept / Decline flow', 'Auto-expiry (7 days)', 'Offer history tracking'],
    gradient: 'from-emerald-500 to-teal-500',
    light: 'bg-emerald-50',
    tag: 'Digital offers',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gray-50/80">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <span className="rounded-full bg-pink-100 px-4 py-1.5 text-sm font-semibold text-pink-700">
            Everything you need
          </span>
          <h2 className="mt-4 text-4xl font-black text-gray-900 md:text-5xl">
            The full hiring stack,<br />
            <span className="bg-gradient-to-r from-pink-500 to-amber-400 bg-clip-text text-transparent">beautifully integrated</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div key={i} className={cn('group relative overflow-hidden rounded-2xl border bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl')}>
              {/* Top accent bar */}
              <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', f.gradient)} />

              <div className="flex items-start gap-4 mb-5">
                <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', f.gradient)}>
                  {f.icon}
                </div>
                <div>
                  <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold mb-1', f.light,
                    i === 0 ? 'text-violet-700' : i === 1 ? 'text-pink-700' : i === 2 ? 'text-amber-700' : 'text-emerald-700'
                  )}>
                    {f.tag}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{f.title}</h3>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-5">{f.desc}</p>

              <ul className="space-y-2">
                {f.bullets.map((b, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className={cn('flex size-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br', f.gradient)}>
                      <Check className="size-2.5 text-white" strokeWidth={3} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Live Demo Preview ─────────────────────────────────────────
function DemoPreviewSection({ sectionRef }: { sectionRef: React.RefObject<HTMLElement> }) {
  return (
    <section ref={sectionRef} id="demo" className="py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row items-center gap-16">
          {/* Left copy */}
          <div className="md:w-2/5 shrink-0">
            <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              Live demo
            </span>
            <h2 className="mt-4 text-4xl font-black text-gray-900 leading-tight">
              See the pipeline<br />
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">in action</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed">
              Real candidates, live AI scores, and a full-featured detail panel — all running right here in your browser.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                { icon: <BarChart3 className="size-4" />, text: 'AI ranks candidates by fit score automatically' },
                { icon: <Users className="size-4" />, text: 'Click any candidate to open the detail panel' },
                { icon: <Clock className="size-4" />, text: 'Stage moves, notes, emails, and offer generation' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    {item.icon}
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>

            <Link
              to="/app"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200/60 transition-all hover:shadow-emerald-300/70 hover:scale-105"
            >
              Open full app <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Right — live mockup */}
          <div className="w-full md:w-3/5 animate-float-slow">
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-violet-100/50 overflow-hidden ring-1 ring-gray-100">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b bg-gray-50/80 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-red-400" />
                  <div className="size-2.5 rounded-full bg-amber-400" />
                  <div className="size-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 rounded-full bg-gray-200/80 px-3 py-0.5 text-[11px] text-gray-400 text-center">
                  app.superhire.io/app
                </div>
              </div>

              {/* Header strip */}
              <div className="flex items-center justify-between border-b px-5 py-3 bg-white">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-lg bg-violet-600">
                    <Sparkles className="size-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">SuperHire ATS</span>
                </div>
                <div className="flex gap-1.5">
                  {['Pipeline', 'Workflows', 'Templates'].map(t => (
                    <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{t}</span>
                  ))}
                </div>
              </div>

              {/* Candidate list */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-700">
                    Applications <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">3</span>
                  </p>
                  <div className="flex gap-1">
                    {['AI Score', 'Name', 'Applied'].map((s, i) => (
                      <span key={s} className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium',
                        i === 0 ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
                      )}>{s}</span>
                    ))}
                  </div>
                </div>

                {DEMO_SCORED.map(({ app, result }, i) => {
                  const c = app.candidate!
                  const av = getAvatarColor(c.full_name)
                  const stage = MOCK_STAGES.find(s => s.id === app.current_stage_id)
                  const isTop = result.total === TOP_SCORE

                  return (
                    <div key={app.id} className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-3 transition-colors cursor-pointer',
                      isTop ? 'border-violet-200 bg-violet-50/50 hover:bg-violet-50' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50',
                    )}>
                      <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                        i === 0 ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'
                      )}>{i + 1}</span>
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className={cn('text-[10px] font-bold', av.bg, av.text)}>
                          {getInitials(c.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-gray-900 truncate">{c.full_name}</span>
                          {isTop && <span className="text-[10px]">👑</span>}
                          {stage && <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700">{stage.name}</span>}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 truncate">{c.email}</p>
                      </div>
                      <AiScoreBadge score={result.total} grade={result.grade} size="sm" />
                    </div>
                  )
                })}

                {/* Fake "AI Scoring Active" footer */}
                <div className="mt-3 rounded-xl border border-dashed border-violet-200 bg-violet-50/60 px-3 py-2 flex items-center gap-2">
                  <Sparkles className="size-3 text-violet-500 shrink-0" />
                  <p className="text-[10px] text-violet-600 font-medium">
                    AI Scoring Active — click any candidate to view the full breakdown
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t bg-gray-900 py-16 text-gray-400">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500">
                <Sparkles className="size-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white">Super<span className="text-violet-400">Hire</span></span>
            </div>
            <p className="text-sm leading-relaxed">
              The AI-powered ATS for modern hiring teams. Hire smarter, faster.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {[
              { title: 'Product', links: ['Features', 'How it works', 'Changelog'] },

              { title: 'App', links: ['Pipeline', 'Workflows', 'Templates', 'Offers'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            ].map(col => (
              <div key={col.title}>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-800 pt-8 text-xs">
          <p>© 2026 SuperHire, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Security'].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function LandingPage() {
  const demoRef = useRef<HTMLElement>(null!)

  function scrollToDemo() {
    demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar onScrollToDemo={scrollToDemo} />
      <HeroSection onScrollToDemo={scrollToDemo} />
      <StatsBar />
      <HowItWorksSection />
      <FeaturesSection />
      <DemoPreviewSection sectionRef={demoRef} />
      <Footer />

    </div>
  )
}
