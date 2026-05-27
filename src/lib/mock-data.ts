// ============================================================
// Mock data for development / demo when Supabase is not auth'd
// ============================================================
import type { Job, Candidate, Application, PipelineStage, Activity, Note } from '@/types/ats'

export const MOCK_JOB: Job = {
  id: 'job-1',
  workspace_id: 'ws-1',
  title: 'Senior Frontend Engineer',
  department: 'Engineering',
  location: 'Remote',
  employment_type: 'full_time',
  description: 'We are looking for a Senior Frontend Engineer to join our team...',
  status: 'open',
  created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  candidate_count: 3,
}

export const MOCK_STAGES: PipelineStage[] = [
  { id: 'stage-1', job_id: 'job-1', name: 'Applied', order_index: 0, created_at: new Date().toISOString() },
  { id: 'stage-2', job_id: 'job-1', name: 'Screening', order_index: 1, created_at: new Date().toISOString() },
  { id: 'stage-3', job_id: 'job-1', name: 'Interview', order_index: 2, created_at: new Date().toISOString() },
  { id: 'stage-4', job_id: 'job-1', name: 'Offer', order_index: 3, created_at: new Date().toISOString() },
  { id: 'stage-5', job_id: 'job-1', name: 'Hired', order_index: 4, created_at: new Date().toISOString() },
]

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    workspace_id: 'ws-1',
    full_name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 234-5678',
    resume_url: null,
    parsed_data: {
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'Docker'],
      summary: 'Senior frontend engineer with 6 years of experience building scalable web applications.',
      experience_years: 6,
      raw_text: '',
    },
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cand-2',
    workspace_id: 'ws-1',
    full_name: 'Jamie Chen',
    email: 'jamie.chen@example.com',
    phone: '+1 (555) 345-6789',
    resume_url: null,
    parsed_data: {
      skills: ['Vue.js', 'JavaScript', 'Python', 'PostgreSQL', 'Redis'],
      summary: 'Full-stack developer with strong frontend focus and 4 years experience.',
      experience_years: 4,
      raw_text: '',
    },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cand-3',
    workspace_id: 'ws-1',
    full_name: 'Morgan Taylor',
    email: 'morgan.taylor@example.com',
    phone: null,
    resume_url: null,
    parsed_data: {
      skills: ['React', 'CSS', 'Figma', 'Accessibility', 'Storybook'],
      summary: 'UI-focused engineer passionate about design systems and accessibility.',
      experience_years: 3,
      raw_text: '',
    },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    candidate_id: 'cand-1',
    job_id: 'job-1',
    current_stage_id: 'stage-3',
    ai_score: null,   // computed live by aiEngine
    status: 'active',
    notes: 'Strong technical background. Showed excellent problem-solving in initial screen.',
    applied_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    candidate: MOCK_CANDIDATES[0],
    job: MOCK_JOB,
    current_stage: MOCK_STAGES[2],
  },
  {
    id: 'app-2',
    candidate_id: 'cand-2',
    job_id: 'job-1',
    current_stage_id: 'stage-2',
    ai_score: null,   // computed live by aiEngine
    status: 'active',
    notes: '',
    applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    candidate: MOCK_CANDIDATES[1],
    job: MOCK_JOB,
    current_stage: MOCK_STAGES[1],
  },
  {
    id: 'app-3',
    candidate_id: 'cand-3',
    job_id: 'job-1',
    current_stage_id: 'stage-1',
    ai_score: null,   // computed live by aiEngine
    status: 'active',
    notes: '',
    applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    candidate: MOCK_CANDIDATES[2],
    job: MOCK_JOB,
    current_stage: MOCK_STAGES[0],
  },
]


export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    application_id: 'app-1',
    type: 'created',
    metadata: {},
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    application_id: 'app-1',
    type: 'stage_moved',
    metadata: { from_stage: 'Applied', to_stage: 'Screening' },
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-3',
    application_id: 'app-1',
    type: 'note_added',
    metadata: { note_preview: 'Strong technical background...' },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-4',
    application_id: 'app-1',
    type: 'email_sent',
    metadata: { email_subject: 'Interview invitation' },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-5',
    application_id: 'app-1',
    type: 'stage_moved',
    metadata: { from_stage: 'Screening', to_stage: 'Interview' },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const MOCK_NOTES: Note[] = [
  {
    id: 'note-1',
    application_id: 'app-1',
    content: 'Strong technical background. Showed excellent problem-solving in initial screen. React expertise confirmed.',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'note-2',
    application_id: 'app-1',
    content: 'Follow up on system design question. Needs to demonstrate scalability thinking.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
