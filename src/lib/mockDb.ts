/**
 * In-memory mock database — replaces Supabase for local/portfolio demo
 * All mutations are reflected immediately in the same session (no persistence).
 */
import type { DbJob, DbApplication } from '@/hooks/useJobLifecycle'

// ── Helpers ───────────────────────────────────────────────────

let _idCounter = 1000
export function newId(): string {
  return `mock-${++_idCounter}`
}

function iso(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function futureIso(daysFromNow = 1, hours = 10): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hours, 0, 0, 0)
  return d.toISOString()
}

// ── Static seed data ──────────────────────────────────────────

export const DEMO_ORG_ID = 'org-demo'
export const DEMO_ORG_NAME = 'SuperAGI'
export const DEMO_USER = {
  id: 'user-demo',
  email: 'superagi@superagi.com',
  full_name: 'Alex Rivera',
  role: 'admin' as const,
  status: 'approved' as const,
  org_id: DEMO_ORG_ID,
  org_name: DEMO_ORG_NAME,
}

// ── Pipeline stages ───────────────────────────────────────────

export interface MockStage {
  id: string
  job_id: string
  name: string
  order_index: number
  color: string
  created_at: string
}

function makeStages(jobId: string): MockStage[] {
  return [
    { id: `${jobId}-s0`, job_id: jobId, name: 'Applied',   order_index: 0, color: 'gray',    created_at: iso(30) },
    { id: `${jobId}-s1`, job_id: jobId, name: 'Screening', order_index: 1, color: 'blue',    created_at: iso(30) },
    { id: `${jobId}-s2`, job_id: jobId, name: 'Interview', order_index: 2, color: 'violet',  created_at: iso(30) },
    { id: `${jobId}-s3`, job_id: jobId, name: 'Offer',     order_index: 3, color: 'amber',   created_at: iso(30) },
    { id: `${jobId}-s4`, job_id: jobId, name: 'Hired',     order_index: 4, color: 'emerald', created_at: iso(30) },
  ]
}

// ── Jobs ──────────────────────────────────────────────────────

const _jobs: DbJob[] = [
  {
    id: 'job-1', title: 'Senior Frontend Engineer', department: 'Engineering',
    location: 'Remote', employment_type: 'full_time', status: 'published',
    description: 'Build beautiful, high-performance UIs with React and TypeScript.',
    created_at: iso(20), updated_at: iso(2), org_id: DEMO_ORG_ID,
    public_slug: 'senior-frontend-engineer', open_positions: 2,
    experience_level: 'senior', extra_fields: null,
  },
  {
    id: 'job-2', title: 'AI/ML Engineer', department: 'AI Research',
    location: 'San Francisco, CA', employment_type: 'full_time', status: 'published',
    description: 'Research and develop cutting-edge AI models and pipelines.',
    created_at: iso(15), updated_at: iso(1), org_id: DEMO_ORG_ID,
    public_slug: 'ai-ml-engineer', open_positions: 1,
    experience_level: 'mid', extra_fields: null,
  },
  {
    id: 'job-3', title: 'Product Designer', department: 'Design',
    location: 'New York, NY', employment_type: 'full_time', status: 'published',
    description: 'Shape product experiences through elegant, user-centered design.',
    created_at: iso(10), updated_at: iso(3), org_id: DEMO_ORG_ID,
    public_slug: 'product-designer', open_positions: 1,
    experience_level: 'mid', extra_fields: null,
  },
  {
    id: 'job-4', title: 'Backend Engineer (Go)', department: 'Engineering',
    location: 'Remote', employment_type: 'full_time', status: 'draft',
    description: 'Build scalable microservices and APIs in Go.',
    created_at: iso(5), updated_at: iso(1), org_id: DEMO_ORG_ID,
    public_slug: null, open_positions: 3,
    experience_level: 'mid', extra_fields: null,
  },
  {
    id: 'job-5', title: 'DevOps / SRE', department: 'Infrastructure',
    location: 'Remote', employment_type: 'contract', status: 'closed',
    description: 'Own reliability, deployment pipelines, and cloud infrastructure.',
    created_at: iso(60), updated_at: iso(10), org_id: DEMO_ORG_ID,
    public_slug: 'devops-sre', open_positions: 0,
    experience_level: 'senior', extra_fields: null,
  },
]

// ── Candidates + Applications ─────────────────────────────────

const RAW_CANDIDATES = [
  {
    id: 'cand-1', full_name: 'Jordan Lee', email: 'jordan.lee@example.com', phone: '+1 415 555 0101',
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(18), updated_at: iso(2),
    parsed_data: { skills: ['React','TypeScript','GraphQL','CSS','Node.js'], summary: 'Passionate frontend engineer with 5 years building SaaS products. Strong eye for design and performance.', experience_years: 5, raw_text: '', has_resume: true, seniority: 'senior' as const },
  },
  {
    id: 'cand-2', full_name: 'Morgan Chen', email: 'morgan.chen@example.com', phone: '+1 650 555 0202',
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(16), updated_at: iso(3),
    parsed_data: { skills: ['Python','PyTorch','LLMs','MLOps','Kubernetes'], summary: 'ML researcher turned engineer, focused on productionizing LLMs at scale.', experience_years: 4, raw_text: '', has_resume: true, seniority: 'mid' as const },
  },
  {
    id: 'cand-3', full_name: 'Taylor Nguyen', email: 'taylor.nguyen@example.com', phone: null,
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(14), updated_at: iso(4),
    parsed_data: { skills: ['Figma','UX Research','Design Systems','Prototyping'], summary: 'Product designer with a track record of 0→1 product launches at high-growth startups.', experience_years: 6, raw_text: '', has_resume: false, seniority: 'senior' as const },
  },
  {
    id: 'cand-4', full_name: 'Riley Park', email: 'riley.park@example.com', phone: '+1 312 555 0404',
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(12), updated_at: iso(1),
    parsed_data: { skills: ['React','Vue','JavaScript','CSS Modules'], summary: 'Mid-level frontend dev eager to level up on complex state management and animations.', experience_years: 3, raw_text: '', has_resume: true, seniority: 'mid' as const },
  },
  {
    id: 'cand-5', full_name: 'Casey Kim', email: 'casey.kim@example.com', phone: '+1 206 555 0505',
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(10), updated_at: iso(2),
    parsed_data: { skills: ['Python','TensorFlow','Data Analysis','SQL','Spark'], summary: 'Data scientist moving into ML engineering. Strong analytical skills and production mindset.', experience_years: 3, raw_text: '', has_resume: true, seniority: 'mid' as const },
  },
  {
    id: 'cand-6', full_name: 'Avery Santos', email: 'avery.santos@example.com', phone: null,
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(9), updated_at: iso(0),
    parsed_data: { skills: ['Figma','Sketch','User Testing','Accessibility','Motion'], summary: 'Senior designer specializing in design systems and cross-platform UX consistency.', experience_years: 7, raw_text: '', has_resume: true, seniority: 'senior' as const },
  },
  {
    id: 'cand-7', full_name: 'Blake Turner', email: 'blake.turner@example.com', phone: '+1 917 555 0707',
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(7), updated_at: iso(1),
    parsed_data: { skills: ['React','Next.js','TypeScript','Tailwind','Storybook'], summary: 'Frontend specialist with expertise in design systems and component libraries.', experience_years: 4, raw_text: '', has_resume: true, seniority: 'mid' as const },
  },
  {
    id: 'cand-8', full_name: 'Drew Patel', email: 'drew.patel@example.com', phone: '+1 408 555 0808',
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(6), updated_at: iso(0),
    parsed_data: { skills: ['PyTorch','Transformers','RLHF','Python','Distributed Training'], summary: 'LLM research engineer with publications in NeurIPS and ICML. Looking for applied AI role.', experience_years: 5, raw_text: '', has_resume: true, seniority: 'senior' as const },
  },
  {
    id: 'cand-9', full_name: 'Skyler Wong', email: 'skyler.wong@example.com', phone: null,
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(5), updated_at: iso(0),
    parsed_data: { skills: ['React','TypeScript','Redux','Testing Library','WebSockets'], summary: 'Frontend engineer with strong background in real-time collaborative tools.', experience_years: 2, raw_text: '', has_resume: false, seniority: 'junior' as const },
  },
  {
    id: 'cand-10', full_name: 'Finley Adams', email: 'finley.adams@example.com', phone: '+1 512 555 1010',
    resume_url: null, workspace_id: DEMO_ORG_ID, created_at: iso(4), updated_at: iso(0),
    parsed_data: { skills: ['Figma','HTML/CSS','User Research','Wireframing'], summary: 'Junior designer with a fresh portfolio and strong interest in product strategy.', experience_years: 1, raw_text: '', has_resume: true, seniority: 'junior' as const },
  },
]

// Applications: candidates spread across jobs and stages
const _applicationsRaw = [
  // job-1 (Frontend Engineer) — stages s0..s4
  { id: 'app-1',  cand: 'cand-1', job: 'job-1', stageIdx: 3, status: 'active',   score: 92, appliedDays: 18 },
  { id: 'app-2',  cand: 'cand-4', job: 'job-1', stageIdx: 2, status: 'active',   score: 74, appliedDays: 12 },
  { id: 'app-3',  cand: 'cand-7', job: 'job-1', stageIdx: 2, status: 'active',   score: 81, appliedDays: 7  },
  { id: 'app-4',  cand: 'cand-9', job: 'job-1', stageIdx: 1, status: 'active',   score: 58, appliedDays: 5  },
  // job-2 (AI/ML Engineer)
  { id: 'app-5',  cand: 'cand-2', job: 'job-2', stageIdx: 4, status: 'hired',    score: 95, appliedDays: 16 },
  { id: 'app-6',  cand: 'cand-8', job: 'job-2', stageIdx: 3, status: 'active',   score: 89, appliedDays: 6  },
  { id: 'app-7',  cand: 'cand-5', job: 'job-2', stageIdx: 1, status: 'active',   score: 67, appliedDays: 10 },
  // job-3 (Designer)
  { id: 'app-8',  cand: 'cand-3', job: 'job-3', stageIdx: 3, status: 'active',   score: 88, appliedDays: 14 },
  { id: 'app-9',  cand: 'cand-6', job: 'job-3', stageIdx: 2, status: 'active',   score: 91, appliedDays: 9  },
  { id: 'app-10', cand: 'cand-10',job: 'job-3', stageIdx: 0, status: 'rejected', score: 49, appliedDays: 4  },
]

// ── Offers ────────────────────────────────────────────────────

export interface MockOffer {
  id: string
  application_id: string
  candidate_name: string
  job_title: string
  salary: string | null
  start_date: string | null
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string | null
  responded_at: string | null
  created_at: string
  company_name: string
  role_type: string
  notes: string | null
  token: string
}

const _offers: MockOffer[] = [
  {
    id: 'offer-1', application_id: 'app-1', candidate_name: 'Jordan Lee',
    job_title: 'Senior Frontend Engineer', salary: '$160,000 / yr',
    start_date: futureIso(14), status: 'pending',
    expires_at: futureIso(7), responded_at: null,
    created_at: iso(1), company_name: DEMO_ORG_NAME,
    role_type: 'Full-time', notes: 'Equity included. Remote-first.',
    token: 'tok-offer-1',
  },
  {
    id: 'offer-2', application_id: 'app-8', candidate_name: 'Taylor Nguyen',
    job_title: 'Product Designer', salary: '$140,000 / yr',
    start_date: futureIso(21), status: 'pending',
    expires_at: futureIso(10), responded_at: null,
    created_at: iso(2), company_name: DEMO_ORG_NAME,
    role_type: 'Full-time', notes: null,
    token: 'tok-offer-2',
  },
  {
    id: 'offer-3', application_id: 'app-5', candidate_name: 'Morgan Chen',
    job_title: 'AI/ML Engineer', salary: '$175,000 / yr',
    start_date: iso(-7), status: 'accepted',
    expires_at: iso(-14), responded_at: iso(-12),
    created_at: iso(30), company_name: DEMO_ORG_NAME,
    role_type: 'Full-time', notes: 'Relocation package included.',
    token: 'tok-offer-3',
  },
]

// ── Interviews ────────────────────────────────────────────────

export interface MockInterview {
  id: string
  application_id: string
  candidate_name: string
  job_title: string
  scheduled_at: string
  format: string
  duration_mins: number
}

const _interviews: MockInterview[] = [
  { id: 'iv-1', application_id: 'app-2', candidate_name: 'Riley Park',   job_title: 'Senior Frontend Engineer', scheduled_at: futureIso(1, 10), format: 'video',  duration_mins: 60 },
  { id: 'iv-2', application_id: 'app-3', candidate_name: 'Blake Turner', job_title: 'Senior Frontend Engineer', scheduled_at: futureIso(2, 14), format: 'video',  duration_mins: 45 },
  { id: 'iv-3', application_id: 'app-6', candidate_name: 'Drew Patel',   job_title: 'AI/ML Engineer',           scheduled_at: futureIso(3, 11), format: 'onsite', duration_mins: 120 },
  { id: 'iv-4', application_id: 'app-9', candidate_name: 'Avery Santos', job_title: 'Product Designer',         scheduled_at: futureIso(4, 15), format: 'video',  duration_mins: 60 },
]

// ── Activities ────────────────────────────────────────────────

export interface MockActivity {
  id: string
  application_id: string
  type: string
  metadata: Record<string, unknown>
  created_at: string
}

const _activities: MockActivity[] = [
  { id: 'act-1',  application_id: 'app-1', type: 'created',            metadata: {},                                                    created_at: iso(18) },
  { id: 'act-2',  application_id: 'app-1', type: 'ai_analyzed',        metadata: { score: 92, recommendation: 'Strong hire — aligns closely with role requirements.' }, created_at: iso(17) },
  { id: 'act-3',  application_id: 'app-1', type: 'stage_moved',        metadata: { from_stage: 'Applied', to_stage: 'Screening' },      created_at: iso(15) },
  { id: 'act-4',  application_id: 'app-1', type: 'stage_moved',        metadata: { from_stage: 'Screening', to_stage: 'Interview' },    created_at: iso(10) },
  { id: 'act-5',  application_id: 'app-1', type: 'interview_scheduled',metadata: { scheduled_at: futureIso(1, 10), format: 'video', duration_mins: 60 }, created_at: iso(9) },
  { id: 'act-6',  application_id: 'app-1', type: 'stage_moved',        metadata: { from_stage: 'Interview', to_stage: 'Offer' },        created_at: iso(2) },
  { id: 'act-7',  application_id: 'app-1', type: 'offer_generated',    metadata: { offer_amount: '$160,000 / yr' },                      created_at: iso(1) },
  { id: 'act-8',  application_id: 'app-5', type: 'created',            metadata: {},                                                    created_at: iso(16) },
  { id: 'act-9',  application_id: 'app-5', type: 'ai_analyzed',        metadata: { score: 95, recommendation: 'Exceptional candidate. Prioritize immediately.' }, created_at: iso(15) },
  { id: 'act-10', application_id: 'app-5', type: 'stage_moved',        metadata: { from_stage: 'Applied', to_stage: 'Hired' },          created_at: iso(5)  },
  { id: 'act-11', application_id: 'app-8', type: 'created',            metadata: {},                                                    created_at: iso(14) },
  { id: 'act-12', application_id: 'app-8', type: 'stage_moved',        metadata: { from_stage: 'Applied', to_stage: 'Interview' },      created_at: iso(8)  },
  { id: 'act-13', application_id: 'app-8', type: 'note_added',         metadata: { note_preview: 'Strong portfolio, especially the design system work.' }, created_at: iso(7) },
]

// ── Notes ─────────────────────────────────────────────────────

export interface MockNote {
  id: string
  application_id: string
  content: string
  created_at: string
  updated_at: string
}

const _notes: MockNote[] = [
  { id: 'note-1', application_id: 'app-1', content: 'Impressive portfolio. Strong TypeScript skills. Ask about state management approach in technical round.', created_at: iso(15), updated_at: iso(15) },
  { id: 'note-2', application_id: 'app-8', content: 'Strong portfolio, especially the design system work. Excellent communication in screening call.', created_at: iso(7), updated_at: iso(7) },
  { id: 'note-3', application_id: 'app-5', content: 'Published NeurIPS paper on RLHF alignment — very relevant. Offer letter sent.', created_at: iso(5), updated_at: iso(5) },
]

// ── Email templates ───────────────────────────────────────────

export interface MockEmailTemplate {
  id: string
  org_id: string
  name: string
  subject: string
  body: string
  created_at: string
}

const _emailTemplates: MockEmailTemplate[] = [
  {
    id: 'et-1', org_id: DEMO_ORG_ID, name: 'Application Received',
    subject: 'We received your application for {{job_title}}',
    body: `Hi {{candidate_name}},\n\nThank you for applying to the {{job_title}} role at ${DEMO_ORG_NAME}. We've received your application and our team is reviewing it.\n\nWe'll be in touch within 5-7 business days.\n\nBest regards,\nThe ${DEMO_ORG_NAME} Team`,
    created_at: iso(30),
  },
  {
    id: 'et-2', org_id: DEMO_ORG_ID, name: 'Interview Invitation',
    subject: 'Interview Invitation — {{job_title}} at {{company}}',
    body: `Hi {{candidate_name}},\n\nWe'd love to invite you for an interview for the {{job_title}} position.\n\nPlease reply with your availability for a 60-minute video call.\n\nLooking forward to connecting!\n\nBest,\nThe ${DEMO_ORG_NAME} Team`,
    created_at: iso(30),
  },
  {
    id: 'et-3', org_id: DEMO_ORG_ID, name: 'Rejection (Post-Screen)',
    subject: 'Update on your application — {{job_title}}',
    body: `Hi {{candidate_name}},\n\nThank you for taking the time to apply for the {{job_title}} role at ${DEMO_ORG_NAME}.\n\nAfter careful review, we've decided to move forward with other candidates whose experience more closely matches our current needs.\n\nWe wish you all the best in your search.\n\nWarm regards,\nThe ${DEMO_ORG_NAME} Team`,
    created_at: iso(30),
  },
]

// ── Email settings ────────────────────────────────────────────

export interface MockEmailSettings {
  org_id: string
  provider: 'gmail' | 'outlook' | 'smtp' | null
  email: string
  connected: boolean
  from_name: string | null
  from_email: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_pass: string | null
}

let _emailSettings: MockEmailSettings = {
  org_id: DEMO_ORG_ID, provider: 'smtp', email: 'talent@superagi.com',
  connected: true, from_name: 'SuperAGI Talent', from_email: 'talent@superagi.com',
  smtp_host: 'smtp.superagi.com', smtp_port: 587, smtp_user: 'talent@superagi.com', smtp_pass: '••••••••',
}

// ── Build full DbApplication objects ─────────────────────────

function buildApplications(): DbApplication[] {
  return _applicationsRaw.map(raw => {
    const cand = RAW_CANDIDATES.find(c => c.id === raw.cand)!
    const job  = _jobs.find(j => j.id === raw.job)!
    const stageId = `${raw.job}-s${raw.stageIdx}`
    const stageNames = ['Applied','Screening','Interview','Offer','Hired']
    return {
      id:               raw.id,
      candidate_id:     raw.cand,
      job_id:           raw.job,
      current_stage_id: stageId,
      status:           raw.status,
      notes:            null,
      applied_at:       iso(raw.appliedDays),
      updated_at:       iso(Math.floor(raw.appliedDays / 2)),
      ai_score:         raw.score,
      candidate:        cand,
      current_stage:    { id: stageId, name: stageNames[raw.stageIdx], order: raw.stageIdx },
      job:              { id: job.id, title: job.title, department: job.department },
    } as DbApplication & { ai_score: number | null; job: { id: string; title: string; department: string | null } }
  })
}

// ── Mutable in-memory stores ──────────────────────────────────

let _jobStore        = [..._jobs]
let _applicationStore: (DbApplication & { ai_score: number | null; job: { id: string; title: string; department: string | null } })[] = buildApplications() as any
let _stageStore: MockStage[] = _jobs.flatMap(j => makeStages(j.id))
let _activityStore   = [..._activities]
let _noteStore       = [..._notes]
let _offerStore      = [..._offers]
let _interviewStore  = [..._interviews]
let _emailTemplateStore = [..._emailTemplates]

// ── DB API ────────────────────────────────────────────────────

export const mockDb = {

  // ── Jobs ────────────────────────────────────────────────────

  getJobs(orgId: string): DbJob[] {
    return _jobStore.filter(j => j.org_id === orgId)
  },

  getJobById(id: string): DbJob | undefined {
    return _jobStore.find(j => j.id === id)
  },

  getJobBySlug(slug: string): DbJob | undefined {
    return _jobStore.find(j => j.public_slug === slug && j.status === 'published')
  },

  createJob(data: Partial<DbJob> & { org_id: string }): DbJob {
    const job: DbJob = {
      id:               newId(),
      title:            data.title ?? 'Untitled',
      department:       data.department ?? null,
      location:         data.location ?? null,
      employment_type:  data.employment_type ?? 'full_time',
      description:      data.description ?? null,
      status:           data.status ?? 'draft',
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
      org_id:           data.org_id,
      public_slug:      data.public_slug ?? null,
      open_positions:   data.open_positions ?? 1,
      experience_level: data.experience_level ?? null,
      extra_fields:     data.extra_fields ?? null,
    }
    _jobStore = [job, ..._jobStore]
    // Seed default stages
    _stageStore = [..._stageStore, ...makeStages(job.id)]
    return job
  },

  updateJob(id: string, data: Partial<DbJob>): DbJob | null {
    let updated: DbJob | null = null
    _jobStore = _jobStore.map(j => {
      if (j.id !== id) return j
      updated = { ...j, ...data, updated_at: new Date().toISOString() }
      return updated
    })
    return updated
  },

  // ── Applications ────────────────────────────────────────────

  getApplications(jobId: string) {
    return _applicationStore.filter(a => a.job_id === jobId)
  },

  getApplicationById(id: string) {
    return _applicationStore.find(a => a.id === id) ?? null
  },

  getAllApplications(orgId: string) {
    const jobIds = _jobStore.filter(j => j.org_id === orgId).map(j => j.id)
    return _applicationStore.filter(a => jobIds.includes(a.job_id))
  },

  createApplication(data: { candidate_id: string; job_id: string; stage_id: string; candidate: DbApplication['candidate'] }): DbApplication & { ai_score: number | null } {
    const app = {
      id:               newId(),
      candidate_id:     data.candidate_id,
      job_id:           data.job_id,
      current_stage_id: data.stage_id,
      status:           'active',
      notes:            null,
      applied_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
      ai_score:         null,
      candidate:        data.candidate,
      current_stage:    { id: data.stage_id, name: 'Applied', order: 0 },
      job:              _jobStore.find(j => j.id === data.job_id) ? { id: data.job_id, title: _jobStore.find(j => j.id === data.job_id)!.title, department: _jobStore.find(j => j.id === data.job_id)!.department } : null,
    } as DbApplication & { ai_score: number | null; job: any }
    _applicationStore = [app as any, ..._applicationStore]
    return app
  },

  updateApplication(id: string, data: Partial<DbApplication & { ai_score?: number | null }>) {
    _applicationStore = _applicationStore.map(a =>
      a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a
    )
  },

  // ── Stages ──────────────────────────────────────────────────

  getStages(jobId: string): MockStage[] {
    return _stageStore
      .filter(s => s.job_id === jobId)
      .sort((a, b) => a.order_index - b.order_index)
  },

  upsertStages(jobId: string, stages: Omit<MockStage, 'created_at'>[]): MockStage[] {
    // Remove old stages for this job that aren't in new list
    const newIds = stages.map(s => s.id)
    _stageStore = _stageStore.filter(s => s.job_id !== jobId || newIds.includes(s.id))
    // Upsert each
    for (const s of stages) {
      const existing = _stageStore.find(x => x.id === s.id)
      if (existing) {
        _stageStore = _stageStore.map(x => x.id === s.id ? { ...x, ...s } : x)
      } else {
        _stageStore.push({ ...s, created_at: new Date().toISOString() })
      }
    }
    return this.getStages(jobId)
  },

  // ── Activities ──────────────────────────────────────────────

  getActivities(applicationId: string): MockActivity[] {
    return _activityStore
      .filter(a => a.application_id === applicationId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  addActivity(data: Omit<MockActivity, 'id' | 'created_at'>) {
    const act: MockActivity = { ...data, id: newId(), created_at: new Date().toISOString() }
    _activityStore = [act, ..._activityStore]
    return act
  },

  // ── Notes ───────────────────────────────────────────────────

  getNotes(applicationId: string): MockNote[] {
    return _noteStore
      .filter(n => n.application_id === applicationId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  addNote(applicationId: string, content: string): MockNote {
    const note: MockNote = { id: newId(), application_id: applicationId, content, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    _noteStore = [note, ..._noteStore]
    return note
  },

  deleteNote(id: string) {
    _noteStore = _noteStore.filter(n => n.id !== id)
  },

  // ── Offers ──────────────────────────────────────────────────

  getOffers(orgId: string): MockOffer[] {
    const jobIds = _jobStore.filter(j => j.org_id === orgId).map(j => j.id)
    const appIds = _applicationStore.filter(a => jobIds.includes(a.job_id)).map(a => a.id)
    return _offerStore.filter(o => appIds.includes(o.application_id))
  },

  getOfferByApplicationId(appId: string): MockOffer | undefined {
    return _offerStore.find(o => o.application_id === appId)
  },

  getOfferByToken(token: string): MockOffer | undefined {
    return _offerStore.find(o => o.token === token)
  },

  createOffer(data: Omit<MockOffer, 'id' | 'created_at'>): MockOffer {
    const offer: MockOffer = { ...data, id: newId(), created_at: new Date().toISOString() }
    _offerStore = [offer, ..._offerStore]
    return offer
  },

  respondToOffer(token: string, action: 'accepted' | 'declined'): boolean {
    let found = false
    _offerStore = _offerStore.map(o => {
      if (o.token !== token) return o
      found = true
      return { ...o, status: action, responded_at: new Date().toISOString() }
    })
    return found
  },

  // ── Interviews ──────────────────────────────────────────────

  getInterviews(orgId: string): MockInterview[] {
    const jobIds = _jobStore.filter(j => j.org_id === orgId).map(j => j.id)
    const appIds = _applicationStore.filter(a => jobIds.includes(a.job_id)).map(a => a.id)
    return _interviewStore
      .filter(i => appIds.includes(i.application_id))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  },

  addInterview(data: Omit<MockInterview, 'id'>): MockInterview {
    const iv: MockInterview = { ...data, id: newId() }
    _interviewStore = [iv, ..._interviewStore]
    return iv
  },

  // ── Email Templates ─────────────────────────────────────────

  getEmailTemplates(orgId: string): MockEmailTemplate[] {
    return _emailTemplateStore.filter(t => t.org_id === orgId)
  },

  // ── Email Settings ──────────────────────────────────────────

  getEmailSettings(): MockEmailSettings {
    return { ..._emailSettings }
  },

  saveEmailSettings(data: Partial<MockEmailSettings>) {
    _emailSettings = { ..._emailSettings, ...data }
  },

  // ── Counts / metrics ────────────────────────────────────────

  getCandidateCount(orgId: string): number {
    return this.getAllApplications(orgId).length
  },

  getPendingOfferCount(orgId: string): number {
    return this.getOffers(orgId).filter(o => o.status === 'pending').length
  },
}
